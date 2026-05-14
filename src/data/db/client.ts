import { openDatabaseSync } from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as schema from './schema';

const sqlite = openDatabaseSync('ytc.db');
export const db = drizzle(sqlite, { schema });

export function applyInitialSchema() {
  sqlite.execSync(`
    create table if not exists kid_profiles (
      id text primary key, parent_id text not null, name text not null,
      avatar_emoji text not null, age integer not null,
      daily_limit_minutes integer not null, unlock_gesture text not null,
      updated_at integer not null
    );
    create table if not exists videos (
      id text primary key, profile_id text not null, youtube_id text not null,
      title text not null, thumbnail_url text, duration_sec integer,
      sort_order integer not null, updated_at integer not null
    );
    create table if not exists mutation_log (
      id text primary key, op text not null, payload text not null,
      created_at integer not null
    );
  `);
}
