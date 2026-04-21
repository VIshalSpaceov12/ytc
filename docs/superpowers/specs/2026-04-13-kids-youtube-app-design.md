# Kids YouTube Viewer — Product Requirements Document (PRD)

- **Date:** 2026-04-13
- **Status:** Design approved — ready for implementation planning
- **Stack:** Flutter (iOS + Android) + Supabase (Auth, Postgres w/ RLS)
- **Codename:** `ytc` (kids YouTube companion)

---

## 1. Problem & Goal

Parents want to let young children (toddlers through early elementary) watch YouTube videos without the risks of the standard YouTube/YouTube Kids apps: autoplay into unknown content, recommendations rabbit-hole, accidental taps that exit the video, and unlimited watch time.

**Goal:** A Flutter app in which the parent curates a small list of YouTube videos per child, hands the device to the child, and is confident the child (a) only sees parent-approved videos, (b) cannot accidentally or intentionally exit the player, and (c) has a bounded daily watch time.

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
| Playback | **In-app YouTube IFrame player** (`youtube_player_flutter`, chromeless). Legal per YouTube ToS. |
| Ads policy | **Ads play as YouTube serves them.** Not blocked, not skipped. Parent is coached during onboarding to prefer ad-free channels / enable YouTube Premium on device. See §12.1. |
| Parent Zone idle lock | **Auto-locks after 60 seconds** of no input → kicks back to Profile Picker. |
| Biometric unlock | Face ID / fingerprint deferred to v1.1 (see §11). |
| Stack | Flutter + Supabase. State via Riverpod. Routing via go_router. Local cache via drift (SQLite). |
| Localization | **v1 English-only.** ICU `.arb` scaffolding in place from day one; additional locales v1.2. |
| Min platform | **iOS 13+ · Android API 26+ (Android 8.0) · Flutter 3.22+.** Driven by `youtube_player_flutter` + `screen_brightness` plugin requirements. |

## 5. App Zones & Navigation

The app has three zones with clear boundaries:

### 5.1 Parent Zone (authenticated)
- Sign in / Sign up (Supabase email + Google)
- Dashboard: list of kid profiles → tap to manage
- Per-profile: manage video library, set daily time limit, pick unlock gesture, view watch history, reset today's usage
- Settings: account, password change, sign out, delete account
- **Idle auto-lock:** 60 seconds of no pointer/keyboard input → session ends, app returns to Profile Picker. Prevents kid from wandering into Parent Zone if parent walks away mid-task.

### 5.2 Profile Picker (app's landing screen once parent is signed in)
- Grid of kid avatars + a small **Parent** tile (lock-icon)
- Tap a kid avatar → **Kid Zone** (zero-friction handoff, no password)
- Tap Parent tile → performs the unlock gesture → Parent Zone

### 5.3 Kid Zone (no exit without unlock gesture)
- **Time remaining today** banner at top: "22 min left today"
- Video grid: thumbnails + titles of videos the parent added to *this profile*
- **Empty state** (library has 0 videos): full-screen "Ask a grown-up to add a video! 🎬" + large 🔒 "Leave" button (still requires gesture to exit)
- Tap a video → Player Mode
- Top-right 🔒 "Leave" button — requires unlock gesture to leave Kid Zone

### 5.4 Player Mode (sub-screen of Kid Zone)
- `VideoPlayerShell` wraps `youtube_player_flutter` (chromeless)
- Tap screen (when unlocked) → overlay with: ⏯ · seek bar · 🔊 volume · ☀️ brightness · 🔒 lock · ← back
- Tap 🔒 → fully locked. Overlay disappears. Only the configured unlock gesture restores it.

**Invariant:** Once kid is in Kid Zone, the only path to Parent Zone is via the unlock gesture. No back-button escape, no swipe-to-exit.

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

`:parent_tz` is passed by the client from the device locale in v1 (see §16 — explicit setting deferred).

**RLS example:**
```sql
create policy "parent reads own profiles"
  on kid_profiles for select
  using (parent_id = auth.uid());
-- Parallel policies for insert/update/delete and for videos/watch_sessions
-- (joined back to kid_profiles → parents for ownership).
```

**Client cache:** SQLite via `drift` mirrors `kid_profiles` and `videos` for instant load + offline library browsing. Playback itself still needs internet.

**Multi-device sync:** Supabase is the source of truth. On app foreground, client pulls changes since `last_synced_at`. Local edits queue in a mutation log; on reconnect they flush in order. Conflicts resolved **last-write-wins by `updated_at`** — acceptable because parent is a single human and simultaneous edits across devices are rare. `watch_sessions` are append-only per `device_id`; daily-limit query sums across devices so two devices watching simultaneously both count toward the kid's daily budget.

## 7. Player & Lock Behavior

### 7.1 Widget structure
```
VideoPlayerScreen
 └── VideoPlayerShell                  ← owns lock state
      ├── YoutubePlayer (chromeless)
      │     hideControls: true
      │     disableDragSeek: true
      │     hideThumbnail: true
      │     autoPlay: true
      ├── CustomControlsOverlay        ← visible only when unlocked + tapped
      │     ├── TopBar:    ← back · title · 🔒 lock
      │     ├── CenterPlayPause
      │     └── BottomBar: seek bar · ⏱ time · 🔊 volume · ☀️ brightness
      └── UnlockGestureDetector        ← visible only when locked
            - full-screen invisible GestureDetector
            - switches on profile.unlock_gesture
```

### 7.2 State machine
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
       │ system back intercepted (PopScope);     │
       │ only unlock gesture exits.              │
       └─────────────────────────────────────────┘
```

### 7.3 Unlock-gesture handlers
| Gesture | Detection |
| --- | --- |
| `long_press_3s` | `onLongPressStart` → start 3s timer; `onLongPressEnd` before timer fires cancels. Timer completes → unlock. |
| `long_press_5s` | Same, 5s. |
| `double_tap_hold` | `onDoubleTapDown` → start 2s hold timer; lift cancels; timer completes → unlock. |
| `corner_triangle` | Tap top-left corner (80×80 px) → top-right → bottom-center, all within a 3s window. |

**Affordance:** A subtle circular progress ring shows around the finger during any long-press / hold so the parent sees "I am holding correctly, 2s left…". Kids will not understand it; parents will.

### 7.4 Controls (when unlocked)
- **Seek** — draggable bar → `controller.seekTo(Duration)`
- **Volume** — slider → `volume_controller` plugin (system volume)
- **Brightness** — slider → `screen_brightness` plugin (window-local; restored on exit)
- **Back** — pops to kid video grid; closes `watch_session`
- **Lock** — sets `isLocked = true`; hides overlay; intercepts back via `PopScope`

### 7.5 Watch-session tracking
- On video start → insert `watch_sessions` row with `started_at = now()`, `device_id`
- Every 10s during playback → update `seconds_watched`
- On pause/stop/exit → set `ended_at`; flush
- When `remaining_today_sec ≤ 0` during playback → pause video, show full-screen "All done for today! See you tomorrow 🌙" (requires unlock gesture to dismiss — kid cannot tap past it)

### 7.6 System-level behavior
- `wakelock_plus` keeps screen on during playback; released on exit
- Orientation: **landscape** in Player Mode; **portrait** on phones elsewhere; **adaptive (portrait + landscape)** on tablets (iPad, Android tablets) to match platform norms
- Locked state uses `SystemChrome.setEnabledSystemUIMode(immersiveSticky)` to block swipe-to-reveal status/nav bars

### 7.7 Audio interruptions & background behavior
- On phone call / Siri / another app taking audio focus (`AudioSession.interruptionStream`): **pause** the video. Resume prompt on return: "Ready to keep watching? ▶️" (resume button requires a normal tap — not a gesture — since player is still unlocked from kid's perspective).
- If app backgrounds while video is playing (home button, app switcher): **pause** video, set `watch_session.ended_at`. On return, land on Profile Picker — kid zone does not auto-resume a locked session across backgrounds.
- Headphone disconnect → pause (standard iOS/Android convention).

## 8. Parent Flows

### 8.1 First-run onboarding
1. Splash → Sign-up (email/password or Google)
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
3. Client regex extracts `youtube_id`; invalid → inline error
4. Client fetches title + thumbnail + duration via `youtube_player_flutter` metadata (no API key). Parent can edit title before saving.
5. Save → inserts into `videos` with `sort_order = max+1`
6. Library grid updates optimistically + syncs to Supabase

**v1:** no duplicate-URL detection per profile (YAGNI). Add if users request it.

### 8.3 Managing library
- Long-press a video → **Rename**, **Move to another kid**, **Delete**
- Drag to reorder (updates `sort_order`)
- Empty state: "No videos yet — tap ➕ to add one"

### 8.4 Auth flows
- **Sign in:** email/password or Google (Supabase).
- **Forgot password:** "Send reset link" → Supabase emails a magic link → deep-linked screen to set new password.
- **Email verification state:** if parent opens app with unverified email, show blocking screen "Verify your email to continue" + resend button. All Parent Zone actions blocked until verified.
- **Session expiry:** silent refresh; on refresh failure, bounce to sign-in.

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
If parent can't perform their chosen unlock gesture (e.g., forgot they set `corner_triangle`, set it on a different device layout, etc.):
1. On the Profile Picker, tap Parent tile → gesture prompt appears.
2. After 30 seconds of failed / no-progress attempts, a small "Forgot gesture?" link fades in (kid cannot trigger this — they give up before 30s of focused attempts).
3. Link → Supabase password re-authentication screen.
4. On successful password entry → unlock + force reset of the unlock gesture (same flow as §8.5 change-gesture). Prevents permanent lockout.

## 9. Error Handling & Edge Cases

| Case | Behavior |
| --- | --- |
| No internet on app open | Load cached profiles + library from SQLite; show "Offline — videos need internet to play" banner in kid zone |
| No internet when kid taps video | Kid-friendly toast: "Oops! We need Wi-Fi 📡" |
| Video removed from YouTube / goes private | IFrame error → "This video isn't available right now"; unlock gesture needed to leave |
| Supabase auth expired | Silent refresh; on failure, bounce parent to sign-in. Kid zone keeps working from cache until parent re-auths. |
| Unverified email | Block Parent Zone with verify-email screen (see §8.4). Kid zone still works from cache. |
| Forgot unlock gesture | Recovery via password re-auth after 30s of failed attempts (see §8.6) |
| Forgot password | Supabase magic-link reset (see §8.4) |
| Clock tampering (kid changes device time to reset daily limit) | **v1 accepted limitation.** "Today" is computed from device clock. Mitigation = v1.1 Edge Function (see §11). |
| Parent kills app mid-playback | On next open, any open `watch_session` older than 1h is closed with `ended_at = started_at + seconds_watched` |
| App killed during locked playback | On relaunch, land in Profile Picker. Kid zone does not persist across cold starts (simpler + safer). |
| Phone call / Siri during playback | Pause; show resume prompt when call ends (see §7.7) |
| App backgrounded during playback | Pause; close watch_session; on return land at Profile Picker |
| Multi-device edit conflict | Last-write-wins by `updated_at` (see §6) |
| Kid library empty | "Ask a grown-up to add a video! 🎬" screen (see §5.3) |

## 10. Project Structure (Flutter)

```
lib/
├── main.dart
├── app.dart                      # MaterialApp + router
├── core/
│   ├── supabase_client.dart
│   ├── router.dart               # go_router config
│   ├── theme.dart
│   ├── l10n/                     # ARB files; English only in v1
│   └── telemetry.dart            # Sentry + event logging
├── data/
│   ├── models/                   # Parent, KidProfile, Video, WatchSession
│   ├── repositories/             # ProfileRepo, VideoRepo, WatchSessionRepo
│   │                             # (Supabase source + drift cache, offline-first)
│   ├── sync/
│   │   └── mutation_log.dart     # offline edit queue, conflict resolution
│   └── local/
│       └── drift_db.dart
├── features/
│   ├── auth/                     # sign-in, sign-up, forgot-password, verify-email
│   ├── profile_picker/
│   ├── parent/
│   │   ├── dashboard/
│   │   ├── library/              # add/edit/reorder videos
│   │   ├── settings/             # includes forgot-gesture recovery
│   │   └── idle_guard.dart       # 60s auto-lock timer
│   ├── kid/
│   │   ├── library_grid/
│   │   ├── empty_state/
│   │   └── time_remaining_banner/
│   └── player/
│       ├── video_player_screen.dart
│       ├── video_player_shell.dart
│       ├── custom_controls_overlay.dart
│       ├── unlock_gesture_detector.dart
│       ├── audio_session_handler.dart
│       └── gestures/             # one file per gesture type
└── shared/
    ├── widgets/
    └── utils/                    # youtube_url_parser, time_formatting
```

**Key plugins:** `supabase_flutter`, `youtube_player_flutter`, `flutter_riverpod`, `go_router`, `drift` + `sqflite`, `screen_brightness`, `volume_controller`, `wakelock_plus`, `audio_session`, `sentry_flutter`, `flutter_localizations`, `intl`.

## 11. Out of Scope (v1) — Deferred

- **Edge Functions for tamper-resistant time limits** (Approach B) — v1.1
- **Biometric unlock** (Face ID / fingerprint) as a fifth unlock option — v1.1
- **iOS/Android share extension** ("Share to Kids App" from YouTube app) — v1.1
- **Tablet-optimized layouts** beyond adaptive orientation (split views, larger grids) — v1.2
- **Accessibility rigor** (VoiceOver/TalkBack labels, dynamic type, high-contrast) on Parent surface — v1.1
- **Additional locales** (i18n beyond English) — v1.2 onward
- YouTube Data API integration for richer metadata
- Push notifications / weekly email digests
- In-app purchases / subscription gating
- Shared / community libraries
- Categories, tags, search inside kid zone
- Captions / closed-captions toggle
- Cast to TV (Chromecast / AirPlay)
- YouTube playlists (v1 is individual videos only)

## 12. Compliance, Privacy & Store Requirements

### 12.1 YouTube ToS & ads policy
- The YouTube IFrame Player API permits embedding but **forbids ad-blocking, ad-skipping, or suppressing branding**. The app respects this in full.
- Ads served by YouTube play as-is. Parents are coached during onboarding (see §8.1 step 6) to prefer ad-free channels or use YouTube Premium for an ad-free experience on that device.
- The app's "chromeless" mode hides surrounding YouTube UI (recommendations, share, channel links, comments) — this is documented as permitted use of the IFrame API.

### 12.2 Kids' privacy — COPPA & GDPR-K
- Target audience includes children under 13 → **COPPA applies** (US). Under 16 in EU → **GDPR-K applies**.
- **Data minimization:** app stores kid's first name, age, avatar emoji, and watch history only. No kid email, no kid photo, no kid device identifier beyond the parent's auth context. Kid name is not required to be real.
- **Parental consent model:** all kid data lives under the parent's authenticated account. No kid signs up directly. Parent deleting account cascades all kid data (RLS-enforced).
- **No third-party ad networks** on children's data. Only YouTube's own ads inside the IFrame (governed by YouTube's own compliance).
- **Privacy policy** required before submission. Hosted at `ytc.app/privacy` (placeholder). Must cover: data collected, purpose, third parties (Supabase = processor; YouTube = separate controller inside IFrame), retention, deletion, contact.

### 12.3 App-store requirements
**Apple App Store — Kids Category:**
- Must satisfy Apple's Kids Category rules (Guideline 1.3 / 5.1.4): no behavioral advertising, no external links without parental gate, parental consent for data collection.
- **Parental gate**: any action leaving the safe zone (external URL, email, support link) must be behind a gate that kids can't pass. The unlock gesture *is* the app's parental gate; documented as such in store listing.
- Apple requires a declared age range (intended: **4+ / 6-8 / 9-11**).

**Google Play — Designed for Families:**
- Developer must complete the "Families" policy declaration; confirms no behavioral ads, SDK allowlist, COPPA-safe SDKs only. Sentry, Supabase, and `youtube_player_flutter` all need confirmation they're on Google's allowlist (or disabled for children's data).

### 12.4 Legal touchpoints before store submission
- Privacy policy URL live
- Terms of service URL live
- Age rating filled: IARC / Apple / Google
- COPPA-safe harbor self-certification (optional but recommended)
- Data Safety form (Google Play) + Privacy Nutrition Label (App Store) completed

## 13. Observability, Platform Minimums & Analytics

### 13.1 Crash reporting & telemetry
- **Sentry** (`sentry_flutter`) in both iOS and Android. Configured to **scrub PII** (no email, no kid name, no video titles) — send only stack traces, device model, OS version, app version.
- Log-level events written via `telemetry.dart`: app launch, sign-in, profile created, video added, watch session start/end, gesture unlock success/fail, idle auto-lock fired. v1 stores in local buffer + flushes to `telemetry_events` Supabase table (parent-scoped via RLS); external analytics SaaS deferred.

### 13.2 Minimum supported platforms
- **iOS 13+** (youtube_player_flutter + screen_brightness floor)
- **Android 8.0 / API 26+** (same)
- **Flutter 3.22+** / Dart 3.4+
- Target 60fps on iPhone 11 / Pixel 5 class hardware

### 13.3 Localization (v1 English-only, prepared for growth)
- All user-facing strings in `lib/core/l10n/app_en.arb` from day one.
- No hard-coded strings in widget code (enforced by a lint).
- Kid-facing copy uses short, concrete, emoji-friendly phrasing (4th-grade reading level max).
- Adding Spanish / Hindi / French in v1.2 should require zero code changes — only new ARB files.

### 13.4 Accessibility (v1 baseline, deeper work v1.1)
- Color contrast ≥ 4.5:1 on all text (WCAG AA).
- Tap targets ≥ 44×44 pt (Apple HIG).
- Parent surface has Semantics labels on all interactive widgets.
- Kid surface accessibility is intentionally minimal in v1 — target users are pre-literate; deeper work (VoiceOver, Dynamic Type) deferred to v1.1.

## 14. Testing Strategy

### Unit tests (every commit)
- `youtube_url_parser` — all supported URL formats + rejection cases
- `daily_limit_calculator` — given sessions + timezone, returns used/remaining seconds
- Each `UnlockGestureHandler` — timing, cancels, completions
- `mutation_log` conflict resolution (multi-device sync)
- Repository layer — mock Supabase, verify offline drift fallback

### Widget tests
- `VideoPlayerShell` lock state transitions (unlocked → locked → unlocked)
- `UnlockGestureDetector` — asserts `onUnlock` fires only on the correct input
- `TimeRemainingBanner` — updates every minute
- Parent "Add video" form — valid/invalid URL handling
- Empty-state kid zone shows correct copy
- IdleGuard auto-locks Parent Zone after 60s

### Integration tests (CI, `integration_test` package)
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

- Parent can sign up, verify email, create profile, add a video, hand phone to kid in **under 3 minutes** (+1 min for email verification vs. original 2-min target)
- Kid can tap profile → tap video → video plays in **≤ 2 taps**
- Locked player resists **30 seconds of simulated toddler random-mashing** without unlocking
- Daily limit enforced within **±10 seconds** of the configured value
- Library grid loads in **< 500ms** from cache after first sync
- Parent Zone auto-locks within **65 seconds** of last input (60s target + 5s grace)
- Crash-free sessions **> 99.5%** (Sentry)

## 16. Open Questions (none blocking v1)

- Branding, app name, icon — pending product/marketing
- App-store age rating tier (4+ vs 6-8 vs 9-11) — needs product decision
- Privacy policy + ToS hosting — needs legal draft
- Parent timezone source: device locale v1; explicit setting in v1.1 if users travel
- Should "Forgot gesture?" link be time-delayed (current: 30s) or attempt-count-delayed? — UX call, revisit after beta

---

**Next step:** invoke `superpowers:writing-plans` skill to produce the implementation plan from this spec.
