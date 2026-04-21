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
| Lock button | Tap 🔒 → **fully locked**: seek, volume, brightness, back all disabled |
| Unlock gesture | Parent picks from: `long_press_3s`, `long_press_5s`, `double_tap_hold`, `corner_triangle` |
| Daily limit | Minutes/day per kid; "All done for today!" when hit |

## Three zones
1. **Parent Zone** — auth, manage profiles, add videos, settings
2. **Profile Picker** — tap kid avatar → Kid Zone · tap Parent tile + gesture → Parent Zone
3. **Kid Zone** — video grid + time-remaining banner → Player. No exit without unlock gesture.

## Data model (Supabase + RLS)
`parents` · `kid_profiles(daily_limit_minutes, unlock_gesture)` · `videos(youtube_id, title, thumbnail)` · `watch_sessions(seconds_watched)` — RLS scopes all rows to `auth.uid()`.

## Controls (unlocked only)
⏯ play/pause · ⏩ seek · 🔊 volume (`volume_controller`) · ☀️ brightness (`screen_brightness`) · 🔒 lock · ← back

## v1 scope: IN
Parent auth · multi-kid profiles · library CRUD · curated playback · configurable unlock gesture · daily time tracking · offline library cache (drift/SQLite)

## v1 scope: OUT
Edge-Function tamper-resistant limits (v1.1) · captions · Cast/AirPlay · playlists · search · in-app purchase · push notifications

## Success criteria
Parent onboarding → hand-off **< 2 min** · Kid to playback **≤ 2 taps** · Locked player survives **30s of toddler mashing** · Daily limit accurate to **±10s** · Library loads **< 500ms** from cache
