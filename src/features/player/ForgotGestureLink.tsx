import { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, TextInput, Alert } from 'react-native';
import { supabase } from '@/data/supabase';
import { colors, space, font } from '@/core/theme';

export function ForgotGestureLink({ visible: parentVisible, onReauth }: {
  visible: boolean; onReauth: () => void;
}) {
  const [show, setShow] = useState(false);
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (!parentVisible) return;
    const id = setTimeout(() => setShow(true), 30_000);
    return () => clearTimeout(id);
  }, [parentVisible]);

  if (!show) return null;

  const submit = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user.email) return;
    const { error } = await supabase.auth.signInWithPassword({
      email: session.user.email, password,
    });
    if (error) return Alert.alert('Wrong password.');
    onReauth();
  };

  if (!open) {
    return (
      <Pressable onPress={() => setOpen(true)} style={styles.link}>
        <Text style={styles.linkText}>Forgot gesture?</Text>
      </Pressable>
    );
  }

  return (
    <View style={styles.container}>
      <TextInput style={styles.input} secureTextEntry value={password}
        onChangeText={setPassword} placeholder="Password" />
      <Pressable onPress={submit} style={styles.button}>
        <Text style={styles.buttonText}>Verify</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  link: { alignSelf: 'center', padding: space.sm },
  linkText: { color: colors.accent, fontSize: font.size.sm },
  container: { padding: space.md, gap: space.sm },
  input: { borderWidth: 1, borderColor: colors.bgDim, padding: space.md, borderRadius: 8 },
  button: { backgroundColor: colors.accent, padding: space.md, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '600' },
});
