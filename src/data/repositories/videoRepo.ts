import { supabase } from '@/data/supabase';
import type { Video, NewVideo } from '@/shared/types/video';

function toCamel(row: any): Video {
  return {
    id: row.id,
    profileId: row.profile_id,
    youtubeId: row.youtube_id,
    title: row.title,
    thumbnailUrl: row.thumbnail_url ?? null,
    durationSec: row.duration_sec ?? null,
    sortOrder: row.sort_order,
    updatedAt: row.updated_at,
  };
}

export async function listVideos(profileId: string): Promise<Video[]> {
  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .eq('profile_id', profileId)
    .order('sort_order', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map(toCamel);
}

export async function addVideo(video: NewVideo): Promise<Video> {
  // Fetch max sort_order for this profile
  const { data: maxRow } = await supabase
    .from('videos')
    .select('sort_order')
    .eq('profile_id', video.profileId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextOrder = maxRow ? (maxRow as any).sort_order + 1 : 0;

  const { data, error } = await supabase
    .from('videos')
    .insert({
      profile_id: video.profileId,
      youtube_id: video.youtubeId,
      title: video.title,
      thumbnail_url: video.thumbnailUrl,
      duration_sec: video.durationSec,
      sort_order: nextOrder,
    } as any)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return toCamel(data);
}

export async function renameVideo(id: string, title: string): Promise<void> {
  const { error } = await supabase
    .from('videos')
    .update({ title } as any)
    .eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteVideo(id: string): Promise<void> {
  const { error } = await supabase
    .from('videos')
    .delete()
    .eq('id', id);
  if (error) throw new Error(error.message);
}

export async function reorderVideos(profileId: string, orderedIds: string[]): Promise<void> {
  const updates = orderedIds.map((id, index) =>
    supabase.from('videos').update({ sort_order: index } as any).eq('id', id)
  );
  const results = await Promise.all(updates);
  const firstError = results.find((r) => r.error);
  if (firstError?.error) throw new Error(firstError.error.message);
}

export async function moveVideoToProfile(id: string, newProfileId: string): Promise<void> {
  const { error } = await supabase
    .from('videos')
    .update({ profile_id: newProfileId } as any)
    .eq('id', id);
  if (error) throw new Error(error.message);
}
