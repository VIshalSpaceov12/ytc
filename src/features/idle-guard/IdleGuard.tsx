import { useEffect, useRef } from 'react';
import { View, PanResponder } from 'react-native';
import { router } from 'expo-router';

const IDLE_MS = 60_000;

export function IdleGuard({ children }: { children: React.ReactNode }) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reset = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      router.replace('/(parent)/profile-picker' as any);
    }, IDLE_MS);
  };

  const pan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => { reset(); return false; },
    onMoveShouldSetPanResponder: () => { reset(); return false; },
  })).current;

  useEffect(() => {
    reset();
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, []);

  return <View style={{ flex: 1 }} {...pan.panHandlers}>{children}</View>;
}
