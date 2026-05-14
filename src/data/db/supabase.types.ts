// Hand-authored to match supabase/migrations/0001_initial_schema.sql.
// Regenerate via `supabase gen types typescript --linked > src/data/db/supabase.types.ts`
// once the CLI is linked.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      parents: {
        Row: {
          id: string;
          display_name: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      kid_profiles: {
        Row: {
          id: string;
          parent_id: string;
          name: string;
          avatar_emoji: string;
          age: number;
          daily_limit_minutes: number;
          unlock_gesture: 'long_press_3s' | 'long_press_5s' | 'double_tap_hold' | 'corner_triangle';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          parent_id: string;
          name: string;
          avatar_emoji?: string;
          age: number;
          daily_limit_minutes?: number;
          unlock_gesture?: 'long_press_3s' | 'long_press_5s' | 'double_tap_hold' | 'corner_triangle';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          parent_id?: string;
          name?: string;
          avatar_emoji?: string;
          age?: number;
          daily_limit_minutes?: number;
          unlock_gesture?: 'long_press_3s' | 'long_press_5s' | 'double_tap_hold' | 'corner_triangle';
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'kid_profiles_parent_id_fkey';
            columns: ['parent_id'];
            referencedRelation: 'parents';
            referencedColumns: ['id'];
          },
        ];
      };
      videos: {
        Row: {
          id: string;
          profile_id: string;
          youtube_id: string;
          title: string;
          thumbnail_url: string | null;
          duration_sec: number | null;
          sort_order: number;
          added_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          youtube_id: string;
          title: string;
          thumbnail_url?: string | null;
          duration_sec?: number | null;
          sort_order?: number;
          added_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          youtube_id?: string;
          title?: string;
          thumbnail_url?: string | null;
          duration_sec?: number | null;
          sort_order?: number;
          added_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'videos_profile_id_fkey';
            columns: ['profile_id'];
            referencedRelation: 'kid_profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      watch_sessions: {
        Row: {
          id: string;
          profile_id: string;
          video_id: string | null;
          device_id: string;
          started_at: string;
          ended_at: string | null;
          seconds_watched: number;
        };
        Insert: {
          id?: string;
          profile_id: string;
          video_id?: string | null;
          device_id: string;
          started_at?: string;
          ended_at?: string | null;
          seconds_watched?: number;
        };
        Update: {
          id?: string;
          profile_id?: string;
          video_id?: string | null;
          device_id?: string;
          started_at?: string;
          ended_at?: string | null;
          seconds_watched?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'watch_sessions_profile_id_fkey';
            columns: ['profile_id'];
            referencedRelation: 'kid_profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'watch_sessions_video_id_fkey';
            columns: ['video_id'];
            referencedRelation: 'videos';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
