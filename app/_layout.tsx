import '@/core/i18n';
import { initTelemetry } from '@/core/telemetry';
import { applyInitialSchema } from '@/data/db/client';
import { closeStaleSessions } from '@/data/repositories/watchSessionRepo';

initTelemetry();
applyInitialSchema();

import { Stack, router } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { ActionSheetProvider } from '@expo/react-native-action-sheet';
import { StyleSheet } from 'react-native';
import { useEffect } from 'react';
import * as Linking from 'expo-linking';
import { queryClient } from '@/core/query-client';
import { useAuthBootstrap } from '@/features/auth/useAuthBootstrap';
import { supabase } from '@/data/supabase';

function useResetDeepLink() {
  useEffect(() => {
    const handleUrl = async ({ url }: { url: string }) => {
      const parsed = Linking.parse(url);
      if (parsed.path === 'reset') {
        const { access_token, refresh_token } = parsed.queryParams as Record<string, string>;
        if (access_token && refresh_token) {
          await supabase.auth.setSession({ access_token, refresh_token });
        }
        router.replace('/(auth)/reset-password');
      }
    };
    const sub = Linking.addEventListener('url', handleUrl);
    Linking.getInitialURL().then((url) => { if (url) handleUrl({ url }); });
    return () => sub.remove();
  }, []);
}

function Providers({ children }: { children: React.ReactNode }) {
  useAuthBootstrap();
  useResetDeepLink();
  useEffect(() => { closeStaleSessions().catch(() => {}); }, []);
  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <ActionSheetProvider>
        <GestureHandlerRootView style={styles.root}>
          <Providers>
            <StatusBar style="auto" />
            <Stack screenOptions={{ headerShown: false }} />
          </Providers>
        </GestureHandlerRootView>
      </ActionSheetProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });
