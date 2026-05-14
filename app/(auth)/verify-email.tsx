import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/data/supabase';
import { useAuthStore } from '@/features/auth/authStore';
import { colors, space, radius, font } from '@/core/theme';

export default function VerifyEmail() {
  const { t } = useTranslation();
  const session = useAuthStore((s) => s.session);
  const [cooldown, setCooldown] = useState(0);

  const resend = async () => {
    if (!session?.user.email) return;
    const { error } = await supabase.auth.resend({
      type: 'signup', email: session.user.email,
    });
    if (error) Alert.alert(error.message);
    setCooldown(60);
    const id = setInterval(() => setCooldown((c) => (c <= 1 ? (clearInterval(id), 0) : c - 1)), 1000);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('auth.verifyEmail')}</Text>
      <Text style={styles.body}>{session?.user.email}</Text>
      <Pressable style={[styles.button, cooldown > 0 && styles.buttonDisabled]} onPress={resend} disabled={cooldown > 0}>
        <Text style={styles.buttonText}>
          {cooldown > 0 ? `${t('auth.resend')} (${cooldown}s)` : t('auth.resend')}
        </Text>
      </Pressable>
      <Pressable onPress={() => supabase.auth.signOut()}>
        <Text style={styles.link}>Sign out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: space.xl, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: font.size.xl, fontWeight: '700', marginBottom: space.md },
  body: { color: colors.textMuted, marginBottom: space.xl },
  button: { backgroundColor: colors.accent, borderRadius: radius.md, padding: space.md, paddingHorizontal: space.xl },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontWeight: '600' },
  link: { color: colors.accent, marginTop: space.xl },
});
