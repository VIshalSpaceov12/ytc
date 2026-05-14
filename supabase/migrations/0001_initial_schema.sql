-- parents (mirrors auth.users)
create table public.parents (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at   timestamptz not null default now()
);

-- kid_profiles
create table public.kid_profiles (
  id                  uuid primary key default gen_random_uuid(),
  parent_id           uuid not null references public.parents(id) on delete cascade,
  name                text not null,
  avatar_emoji        text not null default '🦊',
  age                 int  not null check (age between 0 and 17),
  daily_limit_minutes int  not null default 30 check (daily_limit_minutes between 1 and 1440),
  unlock_gesture      text not null default 'long_press_3s'
                        check (unlock_gesture in
                          ('long_press_3s','long_press_5s',
                           'double_tap_hold','corner_triangle')),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index kid_profiles_parent_idx on public.kid_profiles(parent_id);

-- videos
create table public.videos (
  id            uuid primary key default gen_random_uuid(),
  profile_id    uuid not null references public.kid_profiles(id) on delete cascade,
  youtube_id    text not null,
  title         text not null,
  thumbnail_url text,
  duration_sec  int,
  sort_order    int  not null default 0,
  added_at      timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index videos_profile_idx on public.videos(profile_id, sort_order);

-- watch_sessions
create table public.watch_sessions (
  id              uuid primary key default gen_random_uuid(),
  profile_id      uuid not null references public.kid_profiles(id) on delete cascade,
  video_id        uuid references public.videos(id) on delete set null,
  device_id       text not null,
  started_at      timestamptz not null default now(),
  ended_at        timestamptz,
  seconds_watched int not null default 0 check (seconds_watched >= 0)
);
create index watch_sessions_profile_started_idx
  on public.watch_sessions(profile_id, started_at);

-- updated_at trigger
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger kid_profiles_touch
  before update on public.kid_profiles
  for each row execute function public.touch_updated_at();

create trigger videos_touch
  before update on public.videos
  for each row execute function public.touch_updated_at();

-- auto-create parents row on auth signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.parents (id) values (new.id);
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
