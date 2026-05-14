import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors, space, radius, font } from '@/core/theme';
import { useCreateProfile } from '@/data/queries/profiles';
import type { UnlockGesture } from '@/shared/types/kidProfile';

const EMOJIS = ['🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐸', '🐧', '🦄', '🐲', '🐙', '🐬'];
const AGES = Array.from({ length: 10 }, (_, i) => i + 2); // 2-11

export default function AddKidScreen() {
  const router = useRouter();
  const createProfile = useCreateProfile();

  const [name, setName] = useState('');
  const [age, setAge] = useState(5);
  const [avatarEmoji, setAvatarEmoji] = useState(EMOJIS[0] ?? '🦊');

  const handleContinue = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert('Name required', 'Please enter your child\'s name.');
      return;
    }
    try {
      const profile = await createProfile.mutateAsync({
        name: trimmed,
        avatarEmoji,
        age,
        dailyLimitMinutes: 30,
        unlockGesture: 'long_press_3s' as UnlockGesture,
      });
      router.push({ pathname: '/(parent)/onboarding/pick-limit', params: { id: profile.id } });
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Could not create profile.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Add a kid profile</Text>

      <Text style={styles.label}>Name</Text>
      <TextInput
        style={styles.input}
        placeholder="E.g. Alex"
        placeholderTextColor={colors.textMuted}
        value={name}
        onChangeText={setName}
        maxLength={30}
        autoFocus
      />

      <Text style={styles.label}>Age</Text>
      <View style={styles.row}>
        {AGES.map((a) => (
          <TouchableOpacity
            key={a}
            style={[styles.chip, age === a && styles.chipSelected]}
            onPress={() => setAge(a)}
            accessibilityRole="button"
            accessibilityLabel={`Select age ${a}`}
          >
            <Text style={[styles.chipText, age === a && styles.chipTextSelected]}>{a}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Pick an avatar</Text>
      <View style={styles.emojiGrid}>
        {EMOJIS.map((emoji) => (
          <TouchableOpacity
            key={emoji}
            style={[styles.emojiTile, avatarEmoji === emoji && styles.emojiTileSelected]}
            onPress={() => setAvatarEmoji(emoji)}
            accessibilityRole="button"
            accessibilityLabel={`Select avatar ${emoji}`}
          >
            <Text style={styles.emoji}>{emoji}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.button, createProfile.isPending && styles.buttonDisabled]}
        onPress={handleContinue}
        disabled={createProfile.isPending}
        accessibilityRole="button"
        accessibilityLabel="Continue to set daily limit"
      >
        <Text style={styles.buttonText}>
          {createProfile.isPending ? 'Saving…' : 'Continue'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: space.xl, paddingBottom: space.xxl * 2 },
  title: { fontSize: font.size.xl, fontWeight: font.weight.bold, color: colors.text, marginBottom: space.xl },
  label: { fontSize: font.size.sm, fontWeight: font.weight.medium, color: colors.textMuted, marginBottom: space.sm, marginTop: space.lg },
  input: {
    borderWidth: 1, borderColor: colors.bgDim, borderRadius: radius.md,
    padding: space.md, fontSize: font.size.md, color: colors.text, backgroundColor: colors.bgDim,
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: {
    paddingHorizontal: space.md, paddingVertical: space.sm,
    borderRadius: radius.pill, backgroundColor: colors.bgDim, borderWidth: 1, borderColor: 'transparent',
  },
  chipSelected: { borderColor: colors.accent, backgroundColor: colors.accent + '15' },
  chipText: { fontSize: font.size.sm, color: colors.textMuted },
  chipTextSelected: { color: colors.accent, fontWeight: font.weight.semibold },
  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  emojiTile: {
    width: 52, height: 52, justifyContent: 'center', alignItems: 'center',
    borderRadius: radius.md, backgroundColor: colors.bgDim, borderWidth: 2, borderColor: 'transparent',
  },
  emojiTileSelected: { borderColor: colors.accent },
  emoji: { fontSize: 28 },
  button: {
    marginTop: space.xxl, backgroundColor: colors.accent, borderRadius: radius.pill,
    paddingVertical: space.md + 2, alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: font.size.md, fontWeight: font.weight.semibold },
});
