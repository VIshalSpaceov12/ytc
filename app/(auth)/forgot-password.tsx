import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/data/supabase';
import { colors, space, radius, font } from '@/core/theme';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: 'ytc://reset',
    });
    setBusy(false);
    if (error) return Alert.alert(error.message);
    Alert.alert('Reset link sent. Check your email.');
    router.back();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Forgot password</Text>
      <TextInput style={styles.input} value={email} onChangeText={setEmail}
        keyboardType="email-address" autoCapitalize="none" placeholder="you@example.com" />
      <Pressable style={styles.button} onPress={submit} disabled={busy}>
        <Text style={styles.buttonText}>Send reset link</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: space.xl, justifyContent: 'center' },
  title: { fontSize: font.size.xl, fontWeight: '700', marginBottom: space.xl },
  input: { borderWidth: 1, borderColor: colors.bgDim, borderRadius: radius.md,
    padding: space.md, marginBottom: space.md, fontSize: font.size.md },
  button: { backgroundColor: colors.accent, borderRadius: radius.md, padding: space.md, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '600' },
});
