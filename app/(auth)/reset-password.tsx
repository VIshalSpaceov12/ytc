import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/data/supabase';
import { colors, space, radius, font } from '@/core/theme';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return Alert.alert(error.message);
    Alert.alert('Password updated.');
    router.replace('/');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Set a new password</Text>
      <TextInput style={styles.input} value={password} onChangeText={setPassword}
        secureTextEntry placeholder="New password" />
      <Pressable style={styles.button} onPress={submit} disabled={busy}>
        <Text style={styles.buttonText}>Update password</Text>
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
