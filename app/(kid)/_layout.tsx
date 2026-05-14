import React, { useEffect, useCallback } from 'react';
import { BackHandler } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useAppStateGuard } from '@/features/kid-zone/useAppStateGuard';

export default function KidLayout() {
  const router = useRouter();

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      // Block hardware back button in kid zone
      return true;
    });
    return () => sub.remove();
  }, []);

  const handleBackground = useCallback(() => {
    router.replace('/(parent)/profile-picker');
  }, [router]);

  useAppStateGuard({ onBackground: handleBackground });

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: false,
        animation: 'none',
      }}
    />
  );
}
