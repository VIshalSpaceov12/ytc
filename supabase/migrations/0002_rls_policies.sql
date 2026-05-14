-- Enable RLS on all tables
alter table public.parents        enable row level security;
alter table public.kid_profiles   enable row level security;
alter table public.videos         enable row level security;
alter table public.watch_sessions enable row level security;

-- parents: read/update own row
create policy "parent reads own row"
  on public.parents for select using (id = auth.uid());
create policy "parent updates own row"
  on public.parents for update using (id = auth.uid());

-- kid_profiles: full CRUD scoped by parent_id
create policy "parent reads own profiles"
  on public.kid_profiles for select using (parent_id = auth.uid());
create policy "parent inserts own profiles"
  on public.kid_profiles for insert with check (parent_id = auth.uid());
create policy "parent updates own profiles"
  on public.kid_profiles for update using (parent_id = auth.uid());
create policy "parent deletes own profiles"
  on public.kid_profiles for delete using (parent_id = auth.uid());

-- videos: scoped via the parent owning the profile
create policy "parent reads own videos"
  on public.videos for select
  using (exists (
    select 1 from public.kid_profiles p
    where p.id = videos.profile_id and p.parent_id = auth.uid()
  ));
create policy "parent inserts own videos"
  on public.videos for insert
  with check (exists (
    select 1 from public.kid_profiles p
    where p.id = videos.profile_id and p.parent_id = auth.uid()
  ));
create policy "parent updates own videos"
  on public.videos for update
  using (exists (
    select 1 from public.kid_profiles p
    where p.id = videos.profile_id and p.parent_id = auth.uid()
  ));
create policy "parent deletes own videos"
  on public.videos for delete
  using (exists (
    select 1 from public.kid_profiles p
    where p.id = videos.profile_id and p.parent_id = auth.uid()
  ));

-- watch_sessions: same scope
create policy "parent reads own sessions"
  on public.watch_sessions for select
  using (exists (
    select 1 from public.kid_profiles p
    where p.id = watch_sessions.profile_id and p.parent_id = auth.uid()
  ));
create policy "parent inserts own sessions"
  on public.watch_sessions for insert
  with check (exists (
    select 1 from public.kid_profiles p
    where p.id = watch_sessions.profile_id and p.parent_id = auth.uid()
  ));
create policy "parent updates own sessions"
  on public.watch_sessions for update
  using (exists (
    select 1 from public.kid_profiles p
    where p.id = watch_sessions.profile_id and p.parent_id = auth.uid()
  ));
