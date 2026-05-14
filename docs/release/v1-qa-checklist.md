# v1 Pre-Release QA Checklist

## Devices
- [ ] iPhone (iOS 15+) — physical device
- [ ] Android (API 24+) — physical device
- [ ] iPad — adaptive orientation

## Auth
- [ ] Sign-up → email verification → land at dashboard
- [ ] Sign-in / sign-out
- [ ] Forgot password → email → reset → re-sign-in

## Parent flows
- [ ] Add kid profile (all 4 unlock gestures)
- [ ] Gesture practice gate enforces successful attempt
- [ ] Edit profile, change daily limit, delete profile (typed confirmation)
- [ ] Add 3+ videos (regular URL, youtu.be, shorts)
- [ ] Rename, drag-reorder, delete videos
- [ ] Sign out, sign back in — data persists

## Kid flow
- [ ] Profile picker → tap kid avatar → kid library
- [ ] Tap video → plays, custom controls visible on tap
- [ ] Volume slider, brightness slider, seek bar all work
- [ ] Tap 🔒 → controls hide; tapping screen does nothing
- [ ] Perform unlock gesture → controls return
- [ ] Tap "Leave" (top-right) → gesture → back to profile picker
- [ ] Hardware back (Android) does nothing in kid zone

## Safety
- [ ] 30 seconds of toddler-simulated mashing on locked player — does not unlock
- [ ] Phone call during playback → video pauses → resume prompt on return
- [ ] App backgrounded → returns to profile picker, not kid zone
- [ ] Parent Zone idle 65s → returns to profile picker

## Limits
- [ ] Seed 29 min of watch sessions, play 1 min → "All done" screen appears
- [ ] "All done" requires gesture to dismiss
- [ ] Parent override "Reset today's usage" works

## Offline
- [ ] Disable Wi-Fi → library still loads from cache
- [ ] Tap video offline → kid-friendly "We need Wi-Fi 📡"
- [ ] Re-enable Wi-Fi → playback works

## Multi-device
- [ ] Add video on Device A → appears on Device B within 60s (foreground)

## Compliance
- [ ] Privacy policy URL live and reachable
- [ ] ToS URL live and reachable
- [ ] Age rating set in App Store Connect
- [ ] Apple Kids category + Google Designed for Families declared
- [ ] Data Safety form (Play) + Privacy Nutrition Label (App Store) submitted

## Observability
- [ ] Trigger a controlled error → Sentry dashboard receives event with no PII
