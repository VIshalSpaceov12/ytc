# Supabase Setup

## Project

- **URL:** `https://sslztzfdbwakclkdluhz.supabase.co`
- **Anon key:** stored in `.env.local` (gitignored) as `EXPO_PUBLIC_SUPABASE_ANON_KEY`

## Applying migrations

Two paths — pick whichever fits.

### Path A — Dashboard SQL Editor (fastest, no CLI install)

1. Open the project: https://sslztzfdbwakclkdluhz.supabase.co (Supabase dashboard).
2. Navigate to **SQL Editor** → **New query**.
3. Paste contents of `migrations/0001_initial_schema.sql` → **Run**.
4. New query → paste `migrations/0002_rls_policies.sql` → **Run**.
5. Verify: **Table Editor** should show `parents`, `kid_profiles`, `videos`, `watch_sessions`. Each table should show "RLS enabled".

### Path B — Supabase CLI (recommended for ongoing migration management)

```bash
brew install supabase/tap/supabase
cd /Users/sotsys336/Documents/Projects/ytc
supabase init    # answer "no" to all prompts that ask about generating new files
supabase link --project-ref sslztzfdbwakclkdluhz
# (CLI will prompt for the database password you set when creating the project)
supabase db push
```

## Auth redirect URLs

In **Authentication → URL configuration**, add:

- Site URL: `ytc://`
- Redirect URLs: `ytc://reset` (used by the password-reset flow)
