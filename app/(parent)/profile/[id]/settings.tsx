import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors, space, radius, font } from '@/core/theme';
import { useProfiles, useUpdateProfile, useDeleteProfile } from '@/data/queries/profiles';

export default function ProfileSettingsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: profiles } = useProfiles();
  const updateProfile = useUpdateProfile();
  const deleteProfile = useDeleteProfile();

  const profile = (profiles ?? []).find((p) => p.id === id);

  const [dailyLimit, setDailyLimit] = useState(profile?.dailyLimitMinutes ?? 30);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setDailyLimit(profile.dailyLimitMinutes);
    }
  }, [profile?.dailyLimitMinutes]);

  const handleSave = async () => {
    if (!id) return;
    setIsSaving(true);
    try {
      await updateProfile.mutateAsync({ id, patch: { dailyLimitMinutes: dailyLimit } });
      Alert.alert('Saved', 'Settings updated.');
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Could not save.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    if (!profile) return;
    Alert.prompt(
      'Delete profile',
      `Type "${profile.name}" to confirm deletion. This cannot be undone.`,
      (input) => {
        if (input === profile.name) {
          deleteProfile.mutate(profile.id, {
            onSuccess: () => router.replace('/(parent)/profile-picker'),
            onError: (e: any) => Alert.alert('Error', e.message ?? 'Could not delete.'),
          });
        } else if (input !== undefined && input !== null) {
          Alert.alert('Name did not match', 'Profile was not deleted.');
        }
      },
      'plain-text',
    );
  };

  if (!profile) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFound}>Profile not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{`${profile.name}'s Settings`}</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Daily limit</Text>
        <Text style={styles.limitValue}>{dailyLimit} minutes per day</Text>
        <Slider
          style={styles.slider}
          minimumValue={5}
          maximumValue={180}
          step={5}
          value={dailyLimit}
          onValueChange={(v) => setDailyLimit(Math.round(v))}
          minimumTrackTintColor={colors.accent}
          maximumTrackTintColor={colors.bgDim}
          thumbTintColor={colors.accent}
        />
        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={isSaving}
        >
          <Text style={styles.saveButtonText}>{isSaving ? 'Saving…' : 'Save changes'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Unlock gesture</Text>
        <TouchableOpacity
          style={styles.linkRow}
          onPress={() => router.push({ pathname: '/(parent)/profile/[id]/change-gesture' as any, params: { id } })}
        >
          <Text style={styles.linkText}>
            {profile.unlockGesture.replace(/_/g, ' ')}
          </Text>
          <Text style={styles.linkArrow}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.section, styles.dangerSection]}>
        <Text style={styles.sectionTitle}>Danger zone</Text>
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteButtonText}>Delete profile…</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: space.xxl * 2 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  notFound: { color: colors.textMuted },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.xl,
    paddingTop: space.xxl,
    paddingBottom: space.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.bgDim,
  },
  backButton: { color: colors.accent, fontSize: font.size.md, width: 60 },
  headerTitle: { fontSize: font.size.lg, fontWeight: font.weight.bold, color: colors.text },
  section: { padding: space.xl, borderBottomWidth: 1, borderBottomColor: colors.bgDim },
  sectionTitle: { fontSize: font.size.md, fontWeight: font.weight.semibold, color: colors.textMuted, marginBottom: space.md },
  limitValue: { fontSize: font.size.lg, fontWeight: font.weight.bold, color: colors.text, marginBottom: space.sm },
  slider: { marginBottom: space.md },
  saveButton: {
    backgroundColor: colors.accent, borderRadius: radius.pill,
    paddingVertical: space.md, alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  saveButtonText: { color: '#fff', fontWeight: font.weight.semibold },
  linkRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.bgDim, borderRadius: radius.md, padding: space.md,
  },
  linkText: { fontSize: font.size.md, color: colors.text, textTransform: 'capitalize' },
  linkArrow: { fontSize: font.size.xl, color: colors.textMuted },
  dangerSection: { borderBottomWidth: 0 },
  deleteButton: {
    borderWidth: 1, borderColor: colors.danger, borderRadius: radius.md,
    paddingVertical: space.md, alignItems: 'center',
  },
  deleteButtonText: { color: colors.danger, fontWeight: font.weight.semibold },
});
