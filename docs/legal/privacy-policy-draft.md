# Privacy Policy — Kids YouTube Viewer

**Last updated:** 2026-04-13

## Data we collect
- **Parent account:** email address (Supabase auth).
- **Kid profiles:** first name, age, avatar emoji, daily limit, unlock gesture preference.
- **Watch history:** which video was watched, when, for how long, on which device.

## Why we collect it
- To deliver the curated viewing experience and enforce daily limits.
- To diagnose crashes (Sentry, with PII removed).

## Third parties
- **Supabase** (data processor) — Postgres storage, authentication.
- **YouTube** (separate controller) — video playback via embedded IFrame; subject to YouTube's privacy policy.
- **Sentry** — crash reports; PII fields are scrubbed before transmission.

## Children's privacy (COPPA / GDPR-K)
- We do not knowingly collect personal information from children.
- Kid data is stored under the parent's authenticated account; no kid signs up directly.
- Parents may delete the account at any time; deletion cascades to all kid data.

## Contact
privacy@ytc.app
