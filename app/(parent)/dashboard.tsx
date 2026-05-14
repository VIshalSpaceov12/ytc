import { View, Text, Pressable, StyleSheet } from 'react-native';
import { supabase } from '@/data/supabase';
import { colors, space, radius, font } from '@/core/theme';

export default function Dashboard() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Parent Dashboard</Text>
      <Text style={styles.body}>Kid profiles will appear here.</Text>
      <Pressable style={styles.button} onPress={() => supabase.auth.signOut()}>
        <Text style={styles.buttonText}>Sign out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: space.xl, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: font.size.xl, fontWeight: '700', marginBottom: space.md },
  body: { color: colors.textMuted, marginBottom: space.xl },
  button: { backgroundColor: colors.danger, borderRadius: radius.md, padding: space.md, paddingHorizontal: space.xl },
  buttonText: { color: '#fff', fontWeight: '600' },
});
