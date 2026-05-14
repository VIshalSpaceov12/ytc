import { useEffect, useState } from 'react';
import { todaySessionsForProfile } from '@/data/repositories/watchSessionRepo';
import { computeRemaining } from '@/shared/utils/dailyLimitCalculator';
import { useProfiles } from '@/data/queries/profiles';
import { getCalendars } from 'expo-localization';

export function useDailyLimitGuard(profileId: string): number | null {
  const { data } = useProfiles();
  const profile = data?.find((p) => p.id === profileId);
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!profile) return;
    const tz = getCalendars()[0]?.timeZone ?? 'UTC';
    const tick = async () => {
      const sessions = await todaySessionsForProfile(profileId);
      setRemaining(
        computeRemaining({
          sessions,
          limitSec: profile.dailyLimitMinutes * 60,
          nowIso: new Date().toISOString(),
          tz,
        }),
      );
    };
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [profileId, profile]);

  return remaining;
}
