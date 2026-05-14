import { Stack, Redirect } from 'expo-router';
import { useAuthStore } from '@/features/auth/authStore';
import { IdleGuard } from '@/features/idle-guard/IdleGuard';
export default function ParentLayout() {
  const status = useAuthStore((s) => s.status);
  if (status !== 'signed-in') return <Redirect href="/(auth)/sign-in" />;
  return (
    <IdleGuard>
      <Stack screenOptions={{ headerShown: false }} />
    </IdleGuard>
  );
}
