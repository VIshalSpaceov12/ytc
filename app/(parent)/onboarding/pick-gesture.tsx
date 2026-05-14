import { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useUpdateProfile } from '@/data/queries/profiles';
import type { UnlockGesture } from '@/shared/types/kidProfile';
import { UnlockGestureDetector } from '@/features/player/UnlockGestureDetector';
import { usePlayerStore } from '@/features/player/playerStore';
import { colors, space, radius, font } from '@/core/theme';

const OPTIONS: { id: UnlockGesture; label: string; desc: string }[] = [
  { id: 'long_press_3s', label: 'Long press (3s)', desc: 'Hold the screen for 3 seconds' },
  { id: 'long_press_5s', label: 'Long press (5s)', desc: 'Hold the screen for 5 seconds' },
  { id: 'double_tap_hold', label: 'Double tap + hold', desc: 'Tap twice, then hold (2s)' },
  { id: 'corner_triangle', label: 'Corner triangle', desc: 'Tap TL → TR → bottom center' },
];

export default function PickGesture() {
  const { profileId } = useLocalSearchParams<{ profileId: string }>();
  const [selected, setSelected] = useState<UnlockGesture>('long_press_3s');
  const [proven, setProven] = useState(false);
  const update = useUpdateProfile();
  const lock = usePlayerStore((s) => s.lock);
  const isLocked = usePlayerStore((s) => s.isLocked);

  // Auto-lock on selection so the detector is active in the practice area
  useEffect(() => { lock(); setProven(false); }, [selected, lock]);

  // Detect unlock by store flip
  useEffect(() => {
    if (!isLocked) setProven(true);
  }, [isLocked]);

  const confirm = async () => {
    if (!proven) return Alert.alert('Try the gesture once to confirm it works.');
    await update.mutateAsync({ id: profileId ?? '', patch: { unlockGesture: selected } });
    router.push('/(parent)/onboarding/ads-notice' as any);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pick an unlock gesture</Text>
      {OPTIONS.map((o) => (
        <Pressable
          key={o.id}
          style={[styles.card, selected === o.id && styles.cardActive]}
          onPress={() => setSelected(o.id)}
          accessibilityRole="button"
          accessibilityLabel={`Select gesture: ${o.label}`}
        >
          <Text style={styles.label}>{o.label}</Text>
          <Text style={styles.desc}>{o.desc}</Text>
        </Pressable>
      ))}
      <View style={styles.practice}>
        <Text style={styles.practiceLabel}>
          {proven ? '✅ Got it!' : 'Try it once on the dark area below'}
        </Text>
        <View style={styles.practiceArea}>
          <UnlockGestureDetector gesture={selected} />
        </View>
      </View>
      <Pressable
        style={[styles.button, !proven && styles.disabled]}
        onPress={confirm}
        disabled={!proven}
        accessibilityRole="button"
        accessibilityLabel="Confirm unlock gesture selection"
      >
        <Text style={styles.buttonText}>Confirm</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: space.lg, gap: space.sm },
  title: { fontSize: font.size.xl, fontWeight: '700' },
  card: { padding: space.md, borderRadius: radius.md, borderWidth: 2, borderColor: 'transparent', backgroundColor: colors.bgDim },
  cardActive: { borderColor: colors.accent },
  label: { fontSize: font.size.md, fontWeight: '600' },
  desc: { color: colors.textMuted },
  practice: { marginTop: space.md },
  practiceLabel: { textAlign: 'center', marginBottom: space.sm },
  practiceArea: { height: 120, backgroundColor: '#222', borderRadius: radius.md, overflow: 'hidden' },
  button: { backgroundColor: colors.accent, borderRadius: radius.md, padding: space.md, alignItems: 'center', marginTop: space.lg },
  buttonText: { color: '#fff', fontWeight: '600' },
  disabled: { opacity: 0.5 },
});
