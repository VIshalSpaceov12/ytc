export type WatchSession = {
  id: string; profileId: string; videoId: string;
  deviceId: string; startedAt: string; endedAt: string | null; secondsWatched: number;
};
