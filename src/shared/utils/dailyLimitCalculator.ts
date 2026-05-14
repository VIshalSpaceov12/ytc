export type SessionRow = { startedAt: string; secondsWatched: number };

export function computeRemaining(args: {
  sessions: SessionRow[];
  limitSec: number;
  nowIso: string;
  tz: string;
}): number {
  const { sessions, limitSec, nowIso, tz } = args;
  const todayKey = new Date(nowIso).toLocaleDateString('en-CA', { timeZone: tz });
  const used = sessions
    .filter((s) => new Date(s.startedAt).toLocaleDateString('en-CA', { timeZone: tz }) === todayKey)
    .reduce((acc, s) => acc + s.secondsWatched, 0);
  return Math.max(0, limitSec - used);
}
