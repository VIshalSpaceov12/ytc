# Kids YouTube Viewer — Product Requirements Document (PRD)

- **Date:** 2026-04-13
- **Status:** Design approved — ready for implementation planning
- **Stack:** Expo (React Native) + TypeScript + Supabase (Auth, Postgres w/ RLS)
- **Codename:** `ytc` (kids YouTube companion)

---

## 1. Problem & Goal

Parents want to let young children (toddlers through early elementary) watch YouTube videos without the risks of the standard YouTube/YouTube Kids apps: autoplay into unknown content, recommendations rabbit-hole, accidental taps that exit the video, and unlimited watch time.

**Goal:** An Expo React Native app in which the parent curates a small list of YouTube videos per child, hands the device to the child, and is confident the child (a) only sees parent-approved videos, (b) cannot accidentally or intentionally exit the player, and (c) has a bounded daily watch time.

## 2. Non-Goals (v1)

- Community/shared video libraries across parents
- YouTube Data API integration (paid-tier metadata fetching)
- Server-side tamper-resistant time limits (deferred to v1.1 — see §11)
- Push notifications, email digests, analytics beyond Supabase basics
- Subscriptions / in-app purchases
- Captions toggle, Cast-to-TV, playlists, video search, categories
- Ad-blocking or skipping YouTube ads (prohibited by YouTube ToS — see §12.1)

## 3. Personas

- **Parent** — the account owner. Adds videos, configures limits, unlocks the app when handed back.
- **Kid** — uses a profile avatar. No password. Sees only their parent-curated library. Cannot exit without the parent's unlock gesture.

## 4. Key Decisions (from brainstorming + review pass)

| Topic | Decision |
| --- | --- |
| Content source | **Parent-curated only.** Parent pastes YouTube URLs. |
| Accounts | **Parent account + multiple kid profiles.** Tap avatar to enter kid zone (no kid password). |
| Unlock gesture | **Parent picks during setup** from: `long_press_3s`, `long_press_5s`, `double_tap_hold`, `corner_triangle`. Editable in settings. |
| Locked state | **Fully locked.** Seek, volume, brightness, back — all disabled. Only the unlock gesture exits. |
| Viewing limit | **Daily time limit per kid profile** (e.g., 30 min/day). |
| Playback | **In-app YouTube IFrame player** via `react-native-youtube-iframe`. Chromeless, custom controls. Legal per YouTube ToS. |
| Ads policy | **Ads play as YouTube serves them.** Not blocked, not skipped. Parent is coached during onboarding to prefer ad-free channels / enable YouTube Premium on device. See §12.1. |
| Parent Zone idle lock | **Auto-locks after 60 seconds** of no input → kicks back to Profile Picker. |
| Biometric unlock | Face ID / fingerprint deferred to v1.1 (see §11). |
| Stack | **Expo SDK 52+ (React Native) + TypeScript + Supabase.** Expo Router (file-based). State: Zustand (client) + TanStack Query (server). Offline cache: `expo-sqlite` + Drizzle ORM. |
| Localization | **v1 English-only.** `react-i18next` + `expo-localization` scaffolding in place from day one; additional locales v1.2. |
| Min platform | **iOS 15+ · Android API 24+ (Android 7.0) · Expo SDK 52+ · Node 18+.** Driven by Expo SDK 52 floor and `react-native-youtube-iframe` requirements. |

## 5. App Zones & Navigation

The app has three zones with clear boundaries, mapped to Expo Router file groups:

### 5.1 Parent Zone (authenticated) — `app/(parent)/`
- Sign in / Sign up (Supabase email + Google via `expo-auth-session`)
- Dashboard: list of kid profiles → tap to manage
- Per-profile: manage video library, set daily time limit, pick unlock gesture, view watch history, reset today's usage
- Settings: account, password change, sign out, delete account
- **Idle auto-lock:** 60 seconds of no touch input → session ends, app returns to Profile Picker. Prevents kid from wandering into Parent Zone if parent walks away mid-task. Implemented via a top-level touch-tracking `IdleGuard` provider.

### 5.2 Profile Picker — `app/index.tsx` (landing route once signed in)
- Grid of kid avatars + a small **Parent** tile (lock-icon)
- Tap a kid avatar → **Kid Zone** (zero-friction handoff, no password)
- Tap Parent tile → performs the unlock gesture → Parent Zone

### 5.3 Kid Zone — `app/(kid)/`
- **Time remaining today** banner at top: "22 min left today"
- Video grid: thumbnails + titles of videos the parent added to *this profile*
- **Empty state** (library has 0 videos): full-screen "Ask a grown-up to add a video! 🎬" + large 🔒 "Leave" button (still requires gesture to exit)
- Tap a video → Player Mode
- Top-right 🔒 "Leave" button — requires unlock gesture to leave Kid Zone

### 5.4 Player Mode — `app/(kid)/player/[videoId].tsx`
- `<VideoPlayerShell />` wraps `react-native-youtube-iframe` (`YoutubeIframe` component, chromeless)
- Tap screen (when unlocked) → overlay with: ⏯ · seek bar · 🔊 volume · ☀️ brightness · 🔒 lock · ← back
- Tap 🔒 → fully locked. Overlay disappears. Only the configured unlock gesture restores it.

**Invariant:** Once kid is in Kid Zone, the only path to Parent Zone is via the unlock gesture. No back-button escape, no swipe-to-exit. Hardware back button intercepted on Android via `BackHandler.addEventListener`.

## 6. Data Model (Supabase Postgres)

All tables have Row-Level Security. Parent can only read/write their own rows (enforced via `auth.uid()`).

```sql
-- auth.users is Supabase's built-in table (parent identity)

parents
  id            uuid PK (= auth.users.id)
  display_name  text
  created_at    timestamptz

kid_profiles
  id                   uuid PK
  parent_id            uuid FK → parents.id   -- RLS: parent_id = auth.uid()
  name                 text
  avatar_emoji         text
  age                  int
  daily_limit_minutes  int  default 30
  unlock_gesture       text check in
                         ('long_press_3s','long_press_5s',
                          'double_tap_hold','corner_triangle')
  created_at           timestamptz
  updated_at           timestamptz    -- for sync conflict resolution

videos
  id             uuid PK
  profile_id     uuid FK → kid_profiles.id   -- RLS via parent ownership
  youtube_id     text not null
  title          text
  thumbnail_url  text
  duration_sec   int
  added_at       timestamptz
  updated_at     timestamptz
  sort_order     int

watch_sessions
  id              uuid PK
  profile_id      uuid FK → kid_profiles.id
  video_id        uuid FK → videos.id
  device_id       text           -- client-generated; for multi-device dedup
  started_at      timestamptz
  ended_at        timestamptz
  seconds_watched int
  -- INDEX on (profile_id, started_at)
```

**Daily-limit query (runs on app open + every minute during playback):**
```sql
SELECT COALESCE(SUM(seconds_watched), 0) AS used_sec
FROM watch_sessions
WHERE profile_id = :pid
  AND started_at >= date_trunc('day', now() AT TIME ZONE :parent_tz);
```
Remaining = `daily_limit_minutes * 60 - used_sec`. When ≤ 0, kid sees "All done for today!" screen.

`:parent_tz` is passed by the client from the device locale in v1 via `expo-localization` (see §16 — explicit setting deferred).

**RLS example:**
```sql
create policy "parent reads own profiles"
  on kid_profiles for select
  using (parent_id = auth.uid());
-- Parallel policies for insert/update/delete and for videos/watch_sessions
-- (joined back to kid_profiles → parents for ownership).
```

**Client cache:** `expo-sqlite` with **Drizzle ORM** mirrors `kid_profiles` and `videos` for instant load + offline library browsing. Playback itself still needs internet. Sensitive auth state stored in `expo-secure-store`.

**Multi-device sync:** Supabase is the source of truth. On app foreground (`AppState` change to `active`), client pulls changes since `last_synced_at`. Local edits queue in a mutation log; on reconnect they flush in order. Conflicts resolved **last-write-wins by `updated_at`**. `watch_sessions` are append-only per `device_id`; daily-limit query sums across devices.

## 7. Player & Lock Behavior

### 7.1 Component structure
```
<VideoPlayerScreen>
 └── <VideoPlayerShell>                 ← owns lock state (Zustand store)
      ├── <YoutubeIframe>               ← react-native-youtube-iframe
      │     play, mute, volume, webViewProps
      │     allowsFullscreenVideo: false
      │     onChangeState → lifecycle hooks
      ├── <CustomControlsOverlay>       ← visible only when unlocked + tapped
      │     ├── TopBar:    ← back · title · 🔒 lock
      │     ├── CenterPlayPause
      │     └── BottomBar: seek bar · ⏱ time · 🔊 volume · ☀️ brightness
      └── <UnlockGestureDetector>       ← visible only when locked
            - full-screen <Pressable> + react-native-gesture-handler
            - switches on profile.unlock_gesture
```

### 7.2 State machine (Zustand store `playerStore`)
```
       ┌────────────┐  tap screen   ┌──────────────┐
       │ UNLOCKED   │ ────────────▶ │ UNLOCKED+UI  │
       │ (no UI)    │ ◀──────────── │ (overlay on) │
       └────┬───────┘   3s idle     └──────┬───────┘
            │                              │ tap 🔒
            ▼                              ▼
       ┌─────────────────────────────────────────┐
       │              LOCKED                     │
       │ Overlays hidden; seek disabled;         │
       │ volume/brightness gestures disabled;    │
       │ system back intercepted                 │
       │   (BackHandler + router.canGoBack);     │
       │ only unlock gesture exits.              │
       └─────────────────────────────────────────┘
```

### 7.3 Unlock-gesture handlers
Implemented with `react-native-gesture-handler` (LongPressGestureHandler / TapGestureHandler composites):

| Gesture | Detection |
| --- | --- |
| `long_press_3s` | `LongPressGestureHandler minDurationMs={3000}` → on `ACTIVE` state unlock; on cancel reset |
| `long_press_5s` | Same, `minDurationMs={5000}` |
| `double_tap_hold` | Composite: `TapGestureHandler numberOfTaps={2}` → then a 2000ms LongPress timer on second touch |
| `corner_triangle` | Three `Pressable` zones (top-left 80×80, top-right 80×80, bottom-center 80×80) — taps recorded in order, must complete in 3s window, otherwise reset |

**Affordance:** A subtle circular progress ring shows around the finger during any long-press / hold so the parent sees "I am holding correctly, 2s left…". Built with `react-native-svg` + `react-native-reanimated` animated stroke-dashoffset.

### 7.4 Controls (when unlocked)
- **Seek** — `<Slider>` (community RN slider) → `playerRef.current.seekTo(seconds, true)`
- **Volume** — slider → `react-native-volume-manager` (system volume on both platforms)
- **Brightness** — slider → `expo-brightness` (`setBrightnessAsync`); restored to system default on unmount
- **Back** — `router.back()`; closes `watch_session`
- **Lock** — sets `isLocked = true` in `playerStore`; hides overlay; intercepts hardware back

### 7.5 Watch-session tracking
- On video start (`onChangeState === 'playing'` first time) → insert `watch_sessions` row with `started_at = now()`, `device_id`
- Every 10s during playback → update `seconds_watched`
- On pause/stop/exit → set `ended_at`; flush
- When `remaining_today_sec ≤ 0` during playback → pause video, show full-screen "All done for today! See you tomorrow 🌙" (requires unlock gesture to dismiss — kid cannot tap past it)

### 7.6 System-level behavior
- `expo-keep-awake` (`useKeepAwake()` hook) keeps screen on during playback; released on screen unmount
- Orientation: **landscape** in Player Mode (`ScreenOrientation.lockAsync(LANDSCAPE)`); **portrait** on phones elsewhere; **adaptive** on tablets (`DEFAULT` orientation)
- Locked state hides status/nav bars via `expo-status-bar` (`StatusBar hidden`) + `expo-navigation-bar` on Android (`setVisibilityAsync('hidden')`)
- Hardware back button intercepted with `useEffect(() => { const sub = BackHandler.addEventListener('hardwareBackPress', () => isLocked); return sub.remove; })`

### 7.7 Audio interruptions & background behavior
- `expo-av` `Audio.setAudioModeAsync` configured with `interruptionModeIOS: DO_NOT_MIX`, `interruptionModeAndroid: DO_NOT_MIX`. On phone call / Siri / other audio app: **pause** the video. Resume prompt on return: "Ready to keep watching? ▶️" (resume = normal tap, player still unlocked).
- On `AppState` change to `background`: **pause** video, set `watch_session.ended_at`. On return to `active`, land on Profile Picker — kid zone does not auto-resume a locked session across backgrounds.
- Headphone disconnect → pause (handled by audio session config).

## 8. Parent Flows

### 8.1 First-run onboarding
1. Splash (`expo-splash-screen`) → Sign-up (email/password or Google via `expo-auth-session` PKCE flow)
2. **Email verification gate** (email/password only): "We sent a link to `email@…`. Tap it, then come back." Resend button (60s cooldown). Google sign-up skips this.
3. "Add your first kid" → name, avatar emoji, age
4. "Daily limit" → preset chips (15 / 30 / 60) + custom slider → `daily_limit_minutes`
5. "Pick an unlock gesture" → 4 cards with animated demos. Parent must **successfully perform the chosen gesture once** before "Confirm" is enabled → `unlock_gesture` saved.
6. "Ads notice" → one-time sheet: "YouTube may show ads before or during videos. We can't remove them — pick ad-free channels, or use YouTube Premium on this device for an ad-free kid experience." Dismissed with "Got it."
7. "Add a video" → paste URL (see §8.2)
8. Land on Profile Picker

### 8.2 Adding a video
1. Tap **➕ Add video** on a kid's library screen
2. Paste field accepts `youtube.com/watch?v=…`, `youtu.be/…`, `youtube.com/shorts/…`
3. TS regex extracts `youtube_id`; invalid → inline error
4. Thumbnail derived from `https://i.ytimg.com/vi/<id>/hqdefault.jpg`; title fetched via `react-native-youtube-iframe`'s `getVideoDetails()` (oEmbed-backed, no API key). Parent can edit title before saving.
5. Save → inserts into `videos` with `sort_order = max+1` via Supabase JS client + TanStack Query mutation
6. Library grid updates optimistically + syncs to Supabase

**v1:** no duplicate-URL detection per profile (YAGNI). Add if users request it.

### 8.3 Managing library
- Long-press a video → ActionSheet (`@expo/react-native-action-sheet`): **Rename**, **Move to another kid**, **Delete**
- Drag to reorder via `react-native-draggable-flatlist` (updates `sort_order`)
- Empty state: "No videos yet — tap ➕ to add one"

### 8.4 Auth flows
- **Sign in:** email/password or Google (Supabase via `@supabase/supabase-js` + `expo-auth-session` for OAuth).
- **Forgot password:** "Send reset link" → Supabase emails a deep link (`ytc://reset?token=…`) → handled by `expo-linking` → new-password screen.
- **Email verification state:** if parent opens app with unverified email, show blocking screen "Verify your email to continue" + resend button. All Parent Zone actions blocked until verified.
- **Session storage:** Supabase auth session persisted to `expo-secure-store` (not AsyncStorage — auth tokens are sensitive).
- **Session expiry:** Supabase auto-refresh; on refresh failure, bounce to sign-in.

### 8.5 Settings

**Per-profile:**
- Edit name, avatar, age
- Change daily limit
- Change unlock gesture — requires successful practice attempt before save (prevents lockout)
- View today's watch history (title + duration + time)
- Reset today's usage (parent override)
- Delete profile (confirm dialog with typed profile name — destructive)

**Account-level:**
- Change password
- Sign out
- Delete account (cascades all data, respects RLS)

### 8.6 Forgot-gesture recovery
If parent can't perform their chosen unlock gesture:
1. On the Profile Picker, tap Parent tile → gesture prompt appears.
2. After 30 seconds of failed / no-progress attempts, a small "Forgot gesture?" link fades in (kid cannot trigger this — they give up before 30s of focused attempts).
3. Link → Supabase password re-authentication screen.
4. On successful password entry → unlock + force reset of the unlock gesture (same flow as §8.5 change-gesture). Prevents permanent lockout.

## 9. Error Handling & Edge Cases

| Case | Behavior |
| --- | --- |
| No internet on app open | Load cached profiles + library from `expo-sqlite`; show "Offline — videos need internet to play" banner in kid zone |
| No internet when kid taps video | Kid-friendly toast: "Oops! We need Wi-Fi 📡" |
| Video removed from YouTube / goes private | `onChangeState === 'error'` → "This video isn't available right now"; unlock gesture needed to leave |
| Supabase auth expired | Silent refresh via Supabase JS; on failure, bounce to sign-in. Kid zone keeps working from cache. |
| Unverified email | Block Parent Zone with verify-email screen (see §8.4). Kid zone still works from cache. |
| Forgot unlock gesture | Recovery via password re-auth after 30s of failed attempts (see §8.6) |
| Forgot password | Supabase magic-link reset deep-linked back into app (see §8.4) |
| Clock tampering (kid changes device time to reset daily limit) | **v1 accepted limitation.** "Today" is computed from device clock. Mitigation = v1.1 Edge Function (see §11). |
| Parent kills app mid-playback | On next open, any open `watch_session` older than 1h is closed with `ended_at = started_at + seconds_watched` |
| App killed during locked playback | On relaunch, land in Profile Picker. Kid zone does not persist across cold starts (simpler + safer). |
| Phone call / Siri during playback | Pause via `expo-av` audio session interruption; show resume prompt when call ends (see §7.7) |
| App backgrounded during playback | `AppState` listener pauses; closes watch_session; on return land at Profile Picker |
| Multi-device edit conflict | Last-write-wins by `updated_at` (see §6) |
| Kid library empty | "Ask a grown-up to add a video! 🎬" screen (see §5.3) |
| Deep link arrives while in Kid Zone | Queued and applied only after unlock; kid zone is never disrupted by external links |

## 10. Project Structure (Expo + Expo Router)

```
ytc/
├── app/                          # Expo Router file-based routes
│   ├── _layout.tsx               # Root layout: providers (Query, Zustand, IdleGuard, l10n, Sentry)
│   ├── index.tsx                 # Profile Picker (default route)
│   ├── (auth)/
│   │   ├── _layout.tsx           # Unauthenticated stack
│   │   ├── sign-in.tsx
│   │   ├── sign-up.tsx
│   │   ├── verify-email.tsx
│   │   ├── forgot-password.tsx
│   │   └── reset-password.tsx
│   ├── (parent)/
│   │   ├── _layout.tsx           # Parent stack; injects IdleGuard
│   │   ├── dashboard.tsx
│   │   ├── profile/[id]/
│   │   │   ├── library.tsx
│   │   │   ├── settings.tsx
│   │   │   └── add-video.tsx
│   │   ├── settings.tsx
│   │   └── onboarding/
│   │       ├── add-kid.tsx
│   │       ├── pick-limit.tsx
│   │       ├── pick-gesture.tsx
│   │       └── ads-notice.tsx
│   └── (kid)/
│       ├── _layout.tsx           # Kid stack — back-button locked
│       ├── library.tsx
│       └── player/[videoId].tsx
├── src/
│   ├── components/               # Reusable UI: VideoCard, AvatarTile, TimeRemainingBanner, ...
│   ├── features/
│   │   ├── player/
│   │   │   ├── VideoPlayerShell.tsx
│   │   │   ├── CustomControlsOverlay.tsx
│   │   │   ├── UnlockGestureDetector.tsx
│   │   │   ├── gestures/         # one file per gesture type
│   │   │   ├── audioSession.ts
│   │   │   └── playerStore.ts    # Zustand
│   │   ├── library/              # add/edit/reorder hooks
│   │   ├── kid-zone/
│   │   │   ├── EmptyState.tsx
│   │   │   └── TimeRemainingBanner.tsx
│   │   ├── auth/                 # hooks: useAuth, useSession
│   │   └── idle-guard/           # 60s Parent Zone auto-lock provider
│   ├── data/
│   │   ├── supabase.ts           # client init + secure-store adapter
│   │   ├── db/                   # Drizzle schema + expo-sqlite
│   │   │   ├── schema.ts
│   │   │   └── client.ts
│   │   ├── repositories/         # ProfileRepo, VideoRepo, WatchSessionRepo
│   │   ├── sync/
│   │   │   └── mutationLog.ts    # offline edit queue, conflict resolution
│   │   └── queries/              # TanStack Query hooks
│   ├── core/
│   │   ├── theme.ts
│   │   ├── i18n/                 # react-i18next + ARB-style JSON; English-only v1
│   │   ├── telemetry.ts          # Sentry init + event logging
│   │   └── env.ts                # typed env via expo-constants
│   └── shared/
│       ├── utils/                # youtubeUrlParser, timeFormatting
│       └── types/                # Parent, KidProfile, Video, WatchSession (TS types)
├── assets/                       # icons, splash, fonts
├── app.config.ts                 # Expo config (replaces app.json)
├── eas.json                      # EAS Build config
├── tsconfig.json
└── package.json
```

**Key dependencies (npm):**

| Concern | Package |
| --- | --- |
| Framework | `expo` (SDK 52+) · `expo-router` · `react-native` · `typescript` |
| Auth + DB | `@supabase/supabase-js` · `expo-auth-session` · `expo-secure-store` · `expo-linking` |
| Server state | `@tanstack/react-query` |
| Client state | `zustand` |
| Local DB | `expo-sqlite` · `drizzle-orm` · `drizzle-kit` (codegen) |
| Player | `react-native-youtube-iframe` · `react-native-webview` (peer dep) |
| Gestures + animation | `react-native-gesture-handler` · `react-native-reanimated` · `react-native-svg` |
| Volume / brightness | `react-native-volume-manager` · `expo-brightness` |
| Wakelock / orient / status | `expo-keep-awake` · `expo-screen-orientation` · `expo-status-bar` · `expo-navigation-bar` |
| Audio session | `expo-av` |
| Lists / UI | `react-native-draggable-flatlist` · `@expo/react-native-action-sheet` · `@react-native-community/slider` |
| Crash reporting | `@sentry/react-native` |
| Localization | `react-i18next` · `i18next` · `expo-localization` |
| Build | EAS Build (managed) |

## 11. Out of Scope (v1) — Deferred

- **Edge Functions for tamper-resistant time limits** (Approach B) — v1.1
- **Biometric unlock** (Face ID / fingerprint via `expo-local-authentication`) as a fifth unlock option — v1.1
- **iOS/Android share extension** ("Share to Kids App" from YouTube app) — v1.1
- **Tablet-optimized layouts** beyond adaptive orientation (split views, larger grids) — v1.2
- **Accessibility rigor** (VoiceOver/TalkBack labels, dynamic type, high-contrast) on Parent surface — v1.1
- **Additional locales** (i18n beyond English) — v1.2 onward
- YouTube Data API integration for richer metadata
- Push notifications (`expo-notifications`) / weekly email digests
- In-app purchases / subscription gating (`expo-in-app-purchases` / RevenueCat)
- Shared / community libraries
- Categories, tags, search inside kid zone
- Captions / closed-captions toggle
- Cast to TV (Chromecast / AirPlay)
- YouTube playlists (v1 is individual videos only)

## 12. Compliance, Privacy & Store Requirements

### 12.1 YouTube ToS & ads policy
- The YouTube IFrame Player API permits embedding but **forbids ad-blocking, ad-skipping, or suppressing branding**. The app respects this in full.
- Ads served by YouTube play as-is. Parents are coached during onboarding (see §8.1 step 6).
- "Chromeless" mode hides surrounding YouTube UI (recommendations, share, channel links, comments) — permitted use of the IFrame API.

### 12.2 Kids' privacy — COPPA & GDPR-K
- Target audience includes children under 13 → **COPPA applies** (US). Under 16 in EU → **GDPR-K applies**.
- **Data minimization:** app stores kid's first name, age, avatar emoji, watch history only. No kid email, no kid photo, no kid device identifier beyond the parent's auth context. Kid name need not be real.
- **Parental consent model:** all kid data lives under the parent's authenticated account. No kid signs up directly. Parent deleting account cascades all kid data (RLS-enforced).
- **No third-party ad networks** on children's data. Only YouTube's own ads inside the IFrame.
- **Privacy policy** required before submission. Hosted at `ytc.app/privacy` (placeholder). Must cover: data collected, purpose, third parties (Supabase = processor; YouTube = separate controller inside IFrame; Sentry with PII scrubbing), retention, deletion, contact.

### 12.3 App-store requirements
**Apple App Store — Kids Category:**
- Must satisfy Apple's Kids Category rules (Guideline 1.3 / 5.1.4): no behavioral advertising, no external links without parental gate, parental consent for data collection.
- **Parental gate**: the unlock gesture *is* the app's parental gate; documented as such in store listing.
- Apple requires a declared age range (intended: **4+ / 6-8 / 9-11**).
- EAS Build with iOS native config in `app.config.ts`.

**Google Play — Designed for Families:**
- Developer must complete the "Families" policy declaration; confirms no behavioral ads, SDK allowlist, COPPA-safe SDKs only. Sentry, Supabase, and `react-native-youtube-iframe` all need confirmation they're on Google's allowlist (or disabled for children's data).

### 12.4 Legal touchpoints before store submission
- Privacy policy URL live
- Terms of service URL live
- Age rating filled: IARC / Apple / Google
- COPPA-safe harbor self-certification (optional but recommended)
- Data Safety form (Google Play) + Privacy Nutrition Label (App Store) completed

## 13. Observability, Platform Minimums & Analytics

### 13.1 Crash reporting & telemetry
- **`@sentry/react-native`** with `expo-application` integration in both iOS and Android. `beforeSend` scrubs PII (no email, no kid name, no video titles) — send only stack traces, device model, OS version, app version, expo SDK.
- Log-level events written via `src/core/telemetry.ts`: app launch, sign-in, profile created, video added, watch session start/end, gesture unlock success/fail, idle auto-lock fired. v1 stores in local buffer + flushes to `telemetry_events` Supabase table (parent-scoped via RLS); external analytics SaaS deferred.

### 13.2 Minimum supported platforms
- **iOS 15+** (Expo SDK 52 floor)
- **Android 7.0 / API 24+** (Expo SDK 52 floor)
- **Expo SDK 52+**, React Native 0.76+, **Node 18+**, TypeScript 5.3+
- Target 60fps on iPhone 12 / Pixel 6 class hardware. **New Architecture (Fabric/TurboModules) enabled** by default in SDK 52.

### 13.3 Localization (v1 English-only, prepared for growth)
- All user-facing strings in `src/core/i18n/en.json` from day one (resolved via `react-i18next`).
- No hard-coded strings in JSX (enforced via `i18next-parser` lint pass in CI).
- Kid-facing copy uses short, concrete, emoji-friendly phrasing (4th-grade reading level max).
- Adding Spanish / Hindi / French in v1.2 should require zero code changes — only new locale JSON files.

### 13.4 Accessibility (v1 baseline, deeper work v1.1)
- Color contrast ≥ 4.5:1 on all text (WCAG AA).
- Tap targets ≥ 44×44 pt (Apple HIG).
- Parent surface uses `accessibilityLabel`, `accessibilityRole`, `accessibilityHint` on all interactive components.
- Kid surface accessibility is intentionally minimal in v1 — target users are pre-literate; deeper work (VoiceOver, Dynamic Type, screen reader flows) deferred to v1.1.

## 14. Testing Strategy

### Unit tests (Jest + `@testing-library/react-native`, every commit)
- `youtubeUrlParser` — all supported URL formats + rejection cases
- `dailyLimitCalculator` — given sessions + timezone, returns used/remaining seconds
- Each unlock-gesture handler — timing, cancels, completions (use Jest fake timers)
- `mutationLog` conflict resolution (multi-device sync)
- Repository layer — mock Supabase client, verify offline `expo-sqlite` fallback

### Component / integration tests
- `<VideoPlayerShell>` lock state transitions (unlocked → locked → unlocked)
- `<UnlockGestureDetector>` — fires `onUnlock` only on the correct input pattern
- `<TimeRemainingBanner>` — updates every minute
- "Add video" form — valid/invalid URL handling
- Empty-state kid zone shows correct copy
- `IdleGuard` auto-locks Parent Zone after 60s

### E2E tests (Maestro on EAS Build; chosen over Detox for managed Expo workflow)
- Full parent onboarding happy path (incl. email verification simulation + gesture practice)
- Forgot-gesture recovery flow
- Kid flow: pick profile → pick video → lock → random screen-mashing (does not unlock) → gesture (unlocks)
- Daily-limit enforcement: seed 29 min of sessions → watch 1 min → assert "All done" screen
- Audio interruption: start playback → simulate phone call → assert pause → resume prompt

### Manual QA (pre-release)
- Real iOS + Android device (gesture timing differs from simulator)
- **Toddler test** — the only real validation for "kid cannot accidentally unlock"
- Ad-playback on a known ad-supported channel — confirm behavior is graceful
- Multi-device sync: add video on Device A offline → bring online → confirm Device B receives it

## 15. Success Criteria

- Parent can sign up, verify email, create profile, add a video, hand phone to kid in **under 3 minutes**
- Kid can tap profile → tap video → video plays in **≤ 2 taps**
- Locked player resists **30 seconds of simulated toddler random-mashing** without unlocking
- Daily limit enforced within **±10 seconds** of the configured value
- Library grid loads in **< 500ms** from `expo-sqlite` cache after first sync
- Parent Zone auto-locks within **65 seconds** of last input (60s target + 5s grace)
- Crash-free sessions **> 99.5%** (Sentry)
- Cold-start to interactive: **< 2.5s** on iPhone 12 / Pixel 6

## 16. Open Questions (none blocking v1)

- Branding, app name, icon — pending product/marketing
- App-store age rating tier (4+ vs 6-8 vs 9-11) — needs product decision
- Privacy policy + ToS hosting — needs legal draft
- Parent timezone source: device locale v1 (`expo-localization`); explicit setting in v1.1 if users travel
- Should "Forgot gesture?" link be time-delayed (current: 30s) or attempt-count-delayed? — UX call, revisit after beta
- EAS Build tier (free / production) — pending decision when usage projected

---

**Next step:** invoke `superpowers:writing-plans` skill to produce the implementation plan from this spec.
