import { supabase } from '@/data/supabase';
import type { KidProfile, NewKidProfile } from '@/shared/types/kidProfile';

function toCamel(row: any): KidProfile {
  return {
    id: row.id, parentId: row.parent_id, name: row.name,
    avatarEmoji: row.avatar_emoji, age: row.age,
    dailyLimitMinutes: row.daily_limit_minutes,
    unlockGesture: row.unlock_gesture, updatedAt: row.updated_at,
  };
}

export async function listProfiles(): Promise<KidProfile[]> {
  const { data, error } = await supabase
    .from('kid_profiles').select('*').order('created_at', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map(toCamel);
}

export async function createProfile(p: NewKidProfile): Promise<KidProfile> {
  const { data, error } = await supabase
    .from('kid_profiles')
    .insert({
      name: p.name, avatar_emoji: p.avatarEmoji, age: p.age,
      daily_limit_minutes: p.dailyLimitMinutes, unlock_gesture: p.unlockGesture,
    } as any)
    .select().single();
  if (error) throw new Error(error.message);
  return toCamel(data);
}

export async function updateProfile(id: string, patch: Partial<NewKidProfile>): Promise<void> {
  const { error } = await supabase.from('kid_profiles').update({
    name: patch.name, avatar_emoji: patch.avatarEmoji, age: patch.age,
    daily_limit_minutes: patch.dailyLimitMinutes, unlock_gesture: patch.unlockGesture,
  } as any).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteProfile(id: string): Promise<void> {
  const { error } = await supabase.from('kid_profiles').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
