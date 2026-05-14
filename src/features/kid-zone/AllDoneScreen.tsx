import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, space, font } from '@/core/theme';

export function AllDoneScreen({ onLeave }: { onLeave: () => void }) {
  const { t } = useTranslation();
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{t('kid.allDone')}</Text>
      <Pressable style={styles.leave} onPress={onLeave}>
        <Text style={styles.leaveText}>🔒</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' },
  text: { color: '#fff', fontSize: font.size.xl, fontWeight: '700', textAlign: 'center', padding: space.xl },
  leave: { position: 'absolute', top: space.xl, right: space.xl,
    width: 48, height: 48, borderRadius: 24, backgroundColor: colors.overlay,
    alignItems: 'center', justifyContent: 'center' },
  leaveText: { fontSize: 24, color: '#fff' },
});
