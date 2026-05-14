import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { Link } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { signInWithPassword } from '@/features/auth/useSignIn';
import { colors, space, radius, font } from '@/core/theme';

export default function SignIn() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await signInWithPassword(email.trim(), password);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('auth.signIn')}</Text>
      <TextInput
        style={styles.input}
        placeholder={t('auth.email')}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        accessibilityLabel={t('auth.email')}
      />
      <TextInput
        style={styles.input}
        placeholder={t('auth.password')}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        accessibilityLabel={t('auth.password')}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable style={styles.button} onPress={submit} disabled={busy}>
        {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{t('auth.signIn')}</Text>}
      </Pressable>
      <Link href="/(auth)/forgot-password" style={styles.link}>
        {t('auth.forgotPassword')}
      </Link>
      <Link href="/(auth)/sign-up" style={styles.link}>
        {t('auth.signUp')}
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: space.xl, justifyContent: 'center' },
  title: { fontSize: font.size.xl, fontWeight: '700', marginBottom: space.xl },
  input: {
    borderWidth: 1, borderColor: colors.bgDim, borderRadius: radius.md,
    padding: space.md, marginBottom: space.md, fontSize: font.size.md,
  },
  button: {
    backgroundColor: colors.accent, borderRadius: radius.md, padding: space.md,
    alignItems: 'center', marginTop: space.sm,
  },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: font.size.md },
  error: { color: colors.danger, marginBottom: space.sm },
  link: { color: colors.accent, marginTop: space.md, textAlign: 'center' },
});
