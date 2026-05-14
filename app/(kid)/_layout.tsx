import React, { useEffect } from 'react';
import { BackHandler } from 'react-native';
import { Stack } from 'expo-router';

export default function KidLayout() {
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      // Block hardware back button in kid zone
      return true;
    });
    return () => sub.remove();
  }, []);

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
