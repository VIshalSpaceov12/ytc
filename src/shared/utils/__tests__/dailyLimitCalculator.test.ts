import { computeRemaining } from '../dailyLimitCalculator';

describe('computeRemaining', () => {
  const tz = 'America/New_York';
  const limit = 30 * 60;
  const today = new Date('2026-04-13T15:00:00-04:00').toISOString();

  it('returns full limit when no sessions today', () => {
    expect(computeRemaining({ sessions: [], limitSec: limit, nowIso: today, tz })).toBe(1800);
  });

  it('subtracts seconds_watched for today', () => {
    const sessions = [
      { startedAt: '2026-04-13T10:00:00-04:00', secondsWatched: 600 },
      { startedAt: '2026-04-13T12:00:00-04:00', secondsWatched: 300 },
    ];
    expect(computeRemaining({ sessions, limitSec: limit, nowIso: today, tz })).toBe(1800 - 900);
  });

  it('ignores yesterday sessions', () => {
    const sessions = [
      { startedAt: '2026-04-12T23:00:00-04:00', secondsWatched: 1800 },
    ];
    expect(computeRemaining({ sessions, limitSec: limit, nowIso: today, tz })).toBe(1800);
  });

  it('clamps to zero when exceeded', () => {
    const sessions = [{ startedAt: today, secondsWatched: 5000 }];
    expect(computeRemaining({ sessions, limitSec: limit, nowIso: today, tz })).toBe(0);
  });
});
