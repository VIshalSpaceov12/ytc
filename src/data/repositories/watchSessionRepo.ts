import { supabase } from '@/data/supabase';

export async function startSession(profileId: string, videoId: string, deviceId: string): Promise<string> {
  const { data, error } = await supabase.from('watch_sessions').insert({
    profile_id: profileId, video_id: videoId, device_id: deviceId,
  } as any).select('id').single();
  if (error) throw new Error(error.message);
  return (data as any).id;
}

export async function heartbeat(sessionId: string, secondsWatched: number): Promise<void> {
  const { error } = await supabase.from('watch_sessions')
    .update({ seconds_watched: secondsWatched } as any).eq('id', sessionId);
  if (error) throw new Error(error.message);
}

export async function endSession(sessionId: string, secondsWatched: number): Promise<void> {
  const { error } = await supabase.from('watch_sessions')
    .update({ seconds_watched: secondsWatched, ended_at: new Date().toISOString() } as any)
    .eq('id', sessionId);
  if (error) throw new Error(error.message);
}

export async function todaySessionsForProfile(profileId: string): Promise<
  { startedAt: string; secondsWatched: number }[]
> {
  const since = new Date(); since.setHours(0, 0, 0, 0);
  const { data, error } = await supabase.from('watch_sessions')
    .select('started_at, seconds_watched')
    .eq('profile_id', profileId)
    .gte('started_at', since.toISOString());
  if (error) throw new Error(error.message);
  return (data ?? []).map((r: any) => ({ startedAt: r.started_at, secondsWatched: r.seconds_watched }));
}

export async function closeStaleSessions(): Promise<void> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { error } = await supabase.from('watch_sessions').update({
    ended_at: new Date().toISOString(),
  } as any).is('ended_at', null).lt('started_at', oneHourAgo);
  if (error) throw new Error(error.message);
}
