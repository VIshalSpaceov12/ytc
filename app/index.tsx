import { Redirect } from 'expo-router';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { useAuthStore } from '@/features/auth/authStore';

export default function Root() {
  const status = useAuthStore((s) => s.status);
  const session = useAuthStore((s) => s.session);
  if (status === 'loading') {
    return <View style={styles.center}><ActivityIndicator /></View>;
  }
  if (status === 'signed-out') return <Redirect href="/(auth)/sign-in" />;
  if (session && !session.user.email_confirmed_at && session.user.app_metadata.provider === 'email') {
    return <Redirect href="/(auth)/verify-email" />;
  }
  return <Redirect href="/(parent)/dashboard" />;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
