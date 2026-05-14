import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors, space, radius, font } from '@/core/theme';
import { useUpdateProfile } from '@/data/queries/profiles';

const PRESETS = [15, 30, 60];

export default function PickLimitScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const updateProfile = useUpdateProfile();

  const [minutes, setMinutes] = useState(30);

  const handleContinue = async () => {
    if (!id) return;
    try {
      await updateProfile.mutateAsync({ id, patch: { dailyLimitMinutes: minutes } });
      router.push('/(parent)/onboarding/pick-gesture' as any);
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Could not save limit.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Set a daily limit</Text>
      <Text style={styles.subtitle}>How much screen time is OK each day?</Text>

      <View style={styles.presetRow}>
        {PRESETS.map((preset) => (
          <TouchableOpacity
            key={preset}
            style={[styles.preset, minutes === preset && styles.presetSelected]}
            onPress={() => setMinutes(preset)}
            accessibilityRole="button"
            accessibilityLabel={`Set daily limit to ${preset} minutes`}
          >
            <Text style={[styles.presetText, minutes === preset && styles.presetTextSelected]}>
              {preset} min
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.sliderContainer}>
        <Slider
          style={styles.slider}
          minimumValue={5}
          maximumValue={120}
          step={5}
          value={minutes}
          onValueChange={(v) => setMinutes(Math.round(v))}
          minimumTrackTintColor={colors.accent}
          maximumTrackTintColor={colors.bgDim}
          thumbTintColor={colors.accent}
        />
        <Text style={styles.sliderValue}>{minutes} minutes per day</Text>
      </View>

      <TouchableOpacity
        style={[styles.button, updateProfile.isPending && styles.buttonDisabled]}
        onPress={handleContinue}
        disabled={updateProfile.isPending}
        accessibilityRole="button"
        accessibilityLabel="Continue to pick unlock gesture"
      >
        <Text style={styles.buttonText}>
          {updateProfile.isPending ? 'Saving…' : 'Continue'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: space.xl },
  title: { fontSize: font.size.xl, fontWeight: font.weight.bold, color: colors.text, marginBottom: space.sm },
  subtitle: { fontSize: font.size.md, color: colors.textMuted, marginBottom: space.xl },
  presetRow: { flexDirection: 'row', gap: space.md, marginBottom: space.xl },
  preset: {
    flex: 1, paddingVertical: space.md, borderRadius: radius.md,
    backgroundColor: colors.bgDim, alignItems: 'center',
    borderWidth: 2, borderColor: 'transparent',
  },
  presetSelected: { borderColor: colors.accent, backgroundColor: colors.accent + '15' },
  presetText: { fontSize: font.size.md, color: colors.textMuted, fontWeight: font.weight.medium },
  presetTextSelected: { color: colors.accent, fontWeight: font.weight.semibold },
  sliderContainer: { alignItems: 'center', marginBottom: space.xxl },
  slider: { width: '100%' },
  sliderValue: { fontSize: font.size.lg, fontWeight: font.weight.semibold, color: colors.text, marginTop: space.sm },
  button: {
    marginTop: 'auto', backgroundColor: colors.accent, borderRadius: radius.pill,
    paddingVertical: space.md + 2, alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: font.size.md, fontWeight: font.weight.semibold },
});
