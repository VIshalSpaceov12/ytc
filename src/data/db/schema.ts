import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
export const kidProfiles = sqliteTable('kid_profiles', {
  id: text('id').primaryKey(),
  parentId: text('parent_id').notNull(),
  name: text('name').notNull(),
  avatarEmoji: text('avatar_emoji').notNull(),
  age: integer('age').notNull(),
  dailyLimitMinutes: integer('daily_limit_minutes').notNull(),
  unlockGesture: text('unlock_gesture').notNull(),
  updatedAt: integer('updated_at').notNull(),
});
export const videos = sqliteTable('videos', {
  id: text('id').primaryKey(),
  profileId: text('profile_id').notNull(),
  youtubeId: text('youtube_id').notNull(),
  title: text('title').notNull(),
  thumbnailUrl: text('thumbnail_url'),
  durationSec: integer('duration_sec'),
  sortOrder: integer('sort_order').notNull(),
  updatedAt: integer('updated_at').notNull(),
});
export const mutationLog = sqliteTable('mutation_log', {
  id: text('id').primaryKey(),
  op: text('op').notNull(),
  payload: text('payload').notNull(),
  createdAt: integer('created_at').notNull(),
});
