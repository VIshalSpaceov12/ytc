import '@/core/i18n';
import { initTelemetry } from '@/core/telemetry';
initTelemetry();
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClientProvider } from '@tanstack/react-query';
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
      <GestureHandlerRootView style={styles.root}>
        <Providers>
          <Stack screenOptions={{ headerShown: false }} />
        </Providers>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });
