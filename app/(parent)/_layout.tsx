import { Stack, Redirect } from 'expo-router';
import { useAuthStore } from '@/features/auth/authStore';
export default function ParentLayout() {
  const status = useAuthStore((s) => s.status);
  if (status !== 'signed-in') return <Redirect href="/(auth)/sign-in" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
