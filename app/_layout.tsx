import '@/core/i18n';
import { initTelemetry } from '@/core/telemetry';
import { applyInitialSchema } from '@/data/db/client';

initTelemetry();
applyInitialSchema();

import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { ActionSheetProvider } from '@expo/react-native-action-sheet';
import { StyleSheet } from 'react-native';
import { queryClient } from '@/core/query-client';
import { useAuthBootstrap } from '@/features/auth/useAuthBootstrap';

function Providers({ children }: { children: React.ReactNode }) {
  useAuthBootstrap();
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
