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

## 3. Personas

- **Parent** — the account owner. Adds videos, configures limits, unlocks the app when handed back.
- **Kid** — uses a profile avatar. No password. Sees only their parent-curated library. Cannot exit without the parent's unlock gesture.

## 4. Key Decisions (from brainstorming)

| Topic | Decision |
| --- | --- |
| Content source | **Parent-curated only.** Parent pastes YouTube URLs. |
| Accounts | **Parent account + multiple kid profiles.** Tap avatar to enter kid zone (no kid password). |
| Unlock gesture | **Parent picks during setup** from: `long_press_3s`, `long_press_5s`, `double_tap_hold`, `corner_triangle`. Editable in settings. |
| Locked state | **Fully locked.** Seek, volume, brightness, back — all disabled. Only the unlock gesture exits. |
| Viewing limit | **Daily time limit per kid profile** (e.g., 30 min/day). |
| Playback | **In-app YouTube IFrame player** (`youtube_player_flutter`, chromeless). Legal per YouTube ToS. |
| Stack | Flutter + Supabase. State via Riverpod. Routing via go_router. Local cache via drift (SQLite). |

## 5. App Zones & Navigation

The app has three zones with clear boundaries:

### 5.1 Parent Zone (authenticated)
- Sign in / Sign up (Supabase email + Google)
- Dashboard: list of kid profiles → tap to manage
- Per-profile: manage video library, set daily time limit, pick unlock gesture, view watch history, reset today's usage
- Settings: account, password change, sign out, delete account

### 5.2 Profile Picker (app's landing screen once parent is signed in)
- Grid of kid avatars + a small **Parent** tile (lock-icon)
- Tap a kid avatar → **Kid Zone** (zero-friction handoff, no password)
- Tap Parent tile → performs the unlock gesture → Parent Zone

### 5.3 Kid Zone (no exit without unlock gesture)
- **Time remaining today** banner at top: "22 min left today"
- Video grid: thumbnails + titles of videos the parent added to *this profile*
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

videos
  id             uuid PK
  profile_id     uuid FK → kid_profiles.id   -- RLS via parent ownership
  youtube_id     text not null
  title          text
  thumbnail_url  text
  duration_sec   int
  added_at       timestamptz
  sort_order     int

watch_sessions
  id              uuid PK
  profile_id      uuid FK → kid_profiles.id
  video_id        uuid FK → videos.id
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

`:parent_tz` is passed by the client from the device locale in v1 (see §14 — explicit setting deferred).

**RLS example:**
```sql
create policy "parent reads own profiles"
  on kid_profiles for select
  using (parent_id = auth.uid());
-- Parallel policies for insert/update/delete and for videos/watch_sessions
-- (joined back to kid_profiles → parents for ownership).
```

**Client cache:** SQLite via `drift` mirrors `kid_profiles` and `videos` for instant load + offline library browsing. Playback itself still needs internet.

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
- On video start → insert `watch_sessions` row with `started_at = now()`
- Every 10s during playback → update `seconds_watched`
- On pause/stop/exit → set `ended_at`; flush
- When `remaining_today_sec ≤ 0` during playback → pause video, show full-screen "All done for today! See you tomorrow 🌙" (requires unlock gesture to dismiss — kid cannot tap past it)

### 7.6 System-level behavior
- `wakelock_plus` keeps screen on during playback; released on exit
- Orientation: **landscape** in Player Mode; **portrait** elsewhere
- Locked state uses `SystemChrome.setEnabledSystemUIMode(immersiveSticky)` to block swipe-to-reveal status/nav bars

## 8. Parent Flows

### 8.1 First-run onboarding
1. Splash → Sign-up (email/password or Google)
2. "Add your first kid" → name, avatar emoji, age
3. "Daily limit" → preset chips (15 / 30 / 60) + custom slider → `daily_limit_minutes`
4. "Pick an unlock gesture" → 4 cards with animated demos. Parent practices → "Confirm" → `unlock_gesture`
5. "Add a video" → paste URL (see §8.2)
6. Land on Profile Picker

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

### 8.4 Settings
**Per-profile:**
- Edit name, avatar, age
- Change daily limit
- Change unlock gesture
- View today's watch history (title + duration + time)
- Reset today's usage (parent override)
- Delete profile (confirm dialog with typed profile name — destructive)

**Account-level:**
- Change password
- Sign out
- Delete account (cascades all data, respects RLS)

## 9. Error Handling & Edge Cases

| Case | Behavior |
| --- | --- |
| No internet on app open | Load cached profiles + library from SQLite; show "Offline — videos need internet to play" banner in kid zone |
| No internet when kid taps video | Kid-friendly toast: "Oops! We need Wi-Fi 📡" |
| Video removed from YouTube / goes private | IFrame error → "This video isn't available right now"; unlock gesture needed to leave |
| Supabase auth expired | Silent refresh; on failure, bounce parent to sign-in. Kid zone keeps working from cache until parent re-auths. |
| Clock tampering (kid changes device time to reset daily limit) | **v1 accepted limitation.** "Today" is computed from device clock. Mitigation = v1.1 Edge Function (see §11). |
| Parent kills app mid-playback | On next open, any open `watch_session` older than 1h is closed with `ended_at = started_at + seconds_watched` |
| App killed during locked playback | On relaunch, land in Profile Picker. Kid zone does not persist across cold starts (simpler + safer). |

## 10. Project Structure (Flutter)

```
lib/
├── main.dart
├── app.dart                      # MaterialApp + router
├── core/
│   ├── supabase_client.dart
│   ├── router.dart               # go_router config
│   └── theme.dart
├── data/
│   ├── models/                   # Parent, KidProfile, Video, WatchSession
│   ├── repositories/             # ProfileRepo, VideoRepo, WatchSessionRepo
│   │                             # (Supabase source + drift cache, offline-first)
│   └── local/
│       └── drift_db.dart
├── features/
│   ├── auth/
│   ├── profile_picker/
│   ├── parent/
│   │   ├── dashboard/
│   │   ├── library/              # add/edit/reorder videos
│   │   └── settings/
│   ├── kid/
│   │   ├── library_grid/
│   │   └── time_remaining_banner/
│   └── player/
│       ├── video_player_screen.dart
│       ├── video_player_shell.dart
│       ├── custom_controls_overlay.dart
│       ├── unlock_gesture_detector.dart
│       └── gestures/             # one file per gesture type
└── shared/
    ├── widgets/
    └── utils/                    # youtube_url_parser, time_formatting
```

**Key plugins:** `supabase_flutter`, `youtube_player_flutter`, `flutter_riverpod`, `go_router`, `drift` + `sqflite`, `screen_brightness`, `volume_controller`, `wakelock_plus`.

## 11. Out of Scope (v1) — Deferred

- **Edge Functions for tamper-resistant time limits** (Approach B) — v1.1
- YouTube Data API integration for richer metadata
- Push notifications / weekly email digests
- In-app purchases / subscription gating
- Shared / community libraries
- Categories, tags, search inside kid zone
- Captions / closed-captions toggle
- Cast to TV (Chromecast / AirPlay)
- YouTube playlists (v1 is individual videos only)

## 12. Testing Strategy

### Unit tests (every commit)
- `youtube_url_parser` — all supported URL formats + rejection cases
- `daily_limit_calculator` — given sessions + timezone, returns used/remaining seconds
- Each `UnlockGestureHandler` — timing, cancels, completions
- Repository layer — mock Supabase, verify offline drift fallback

### Widget tests
- `VideoPlayerShell` lock state transitions (unlocked → locked → unlocked)
- `UnlockGestureDetector` — asserts `onUnlock` fires only on the correct input
- `TimeRemainingBanner` — updates every minute
- Parent "Add video" form — valid/invalid URL handling

### Integration tests (CI, `integration_test` package)
- Full parent onboarding happy path
- Kid flow: pick profile → pick video → lock → random screen-mashing (does not unlock) → gesture (unlocks)
- Daily-limit enforcement: seed 29 min of sessions → watch 1 min → assert "All done" screen

### Manual QA (pre-release)
- Real iOS + Android device (gesture timing differs from simulator)
- **Toddler test** — the only real validation for "kid cannot accidentally unlock"

## 13. Success Criteria

- Parent can sign up, create profile, add a video, hand phone to kid in **under 2 minutes**
- Kid can tap profile → tap video → video plays in **≤ 2 taps**
- Locked player resists **30 seconds of simulated toddler random-mashing** without unlocking
- Daily limit enforced within **±10 seconds** of the configured value
- Library grid loads in **< 500ms** from cache after first sync

## 14. Open Questions (none blocking v1)

- Branding, app name, icon — pending product/marketing
- App-store age rating strategy — needs legal input before submission
- Parent timezone source: device locale v1; explicit setting in v1.1 if users travel

---

**Next step:** invoke `superpowers:writing-plans` skill to produce the implementation plan from this spec.
