# Kids YouTube Viewer — One-Page Summary

**Date:** 2026-04-13 · **Stack:** Flutter + Supabase · **Full PRD:** [`2026-04-13-kids-youtube-app-design.md`](./2026-04-13-kids-youtube-app-design.md)

## What it is
A Flutter app where a **parent curates YouTube videos per kid**, hands the device over, and is sure the kid can only watch approved videos, cannot accidentally exit, and has a bounded daily watch time.

## Core decisions
| | |
|---|---|
| Content | Parent pastes YouTube URLs into each kid's library |
| Accounts | Parent signs in (Supabase) → multiple kid profiles (tap avatar, no password) |
| Playback | In-app `youtube_player_flutter` (chromeless — no YouTube UI) |
| Ads | Play as YouTube serves them (blocking = ToS violation); parent coached to pick ad-free channels |
| Lock button | Tap 🔒 → **fully locked**: seek, volume, brightness, back all disabled |
| Unlock gesture | Parent picks from: `long_press_3s`, `long_press_5s`, `double_tap_hold`, `corner_triangle`; recovery via password re-auth |
| Parent Zone idle-lock | Auto-locks after 60s, returns to Profile Picker |
| Daily limit | Minutes/day per kid; "All done for today!" when hit |
| Min platforms | iOS 13+ · Android 8.0+ · Flutter 3.22+ |
| Localization | v1 English-only, ARB-ready for future locales |

## Three zones
1. **Parent Zone** — auth (w/ email verify + forgot password), manage profiles, add videos, settings; auto-locks after 60s idle
2. **Profile Picker** — tap kid avatar → Kid Zone · tap Parent tile + gesture → Parent Zone
3. **Kid Zone** — video grid + time-remaining banner → Player. Empty state = "Ask a grown-up to add a video! 🎬". No exit without unlock gesture.

## Data model (Supabase + RLS)
`parents` · `kid_profiles(daily_limit_minutes, unlock_gesture)` · `videos(youtube_id, title, thumbnail)` · `watch_sessions(seconds_watched, device_id)` — RLS scopes all rows to `auth.uid()`. Multi-device sync via last-write-wins on `updated_at`.

## Controls (unlocked only)
⏯ play/pause · ⏩ seek · 🔊 volume · ☀️ brightness · 🔒 lock · ← back. Phone call / audio interruption → auto-pause.

## Compliance & ops
**COPPA / GDPR-K:** kid data is parent-scoped; data minimization; no 3rd-party ad SDKs. **App stores:** Apple Kids category + Google Designed for Families; unlock gesture doubles as Apple's required parental gate. **Observability:** Sentry with PII scrubbed; local telemetry buffer synced to Supabase.

## v1 scope: IN
Parent auth (w/ email verify + password reset) · multi-kid profiles · library CRUD · curated playback · configurable unlock gesture + forgot-gesture recovery · daily time tracking · offline library cache · crash reporting · English localization

## v1 scope: OUT (deferred)
Edge-Function tamper-resistant limits (v1.1) · biometric unlock (v1.1) · iOS/Android share extension (v1.1) · tablet-optimized layouts (v1.2) · deeper accessibility (v1.1) · extra locales (v1.2) · captions · Cast/AirPlay · playlists · search · in-app purchase · push notifications

## Success criteria
Parent onboarding (incl. email verify) → hand-off **< 3 min** · Kid to playback **≤ 2 taps** · Locked player survives **30s of toddler mashing** · Daily limit accurate to **±10s** · Library loads **< 500ms** from cache · Parent Zone auto-locks in **≤ 65s** · Crash-free sessions **> 99.5%**
