import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/data/supabase';
import { colors, space, radius, font } from '@/core/theme';
import { useProfiles } from '@/data/queries/profiles';

export default function DashboardScreen() {
  const router = useRouter();
  const { data: profiles, isLoading } = useProfiles();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Parent Dashboard</Text>
        <TouchableOpacity
          onPress={handleSignOut}
          accessibilityRole="button"
          accessibilityLabel="Sign out"
        >
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {(profiles ?? []).length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No profiles yet. Add a kid to get started.</Text>
            </View>
          ) : (
            (profiles ?? []).map((profile) => (
              <View key={profile.id} style={styles.profileCard}>
                <View style={styles.profileInfo}>
                  <Text style={styles.profileEmoji}>{profile.avatarEmoji}</Text>
                  <View>
                    <Text style={styles.profileName}>{profile.name}</Text>
                    <Text style={styles.profileMeta}>
                      Age {profile.age} · {profile.dailyLimitMinutes} min/day
                    </Text>
                  </View>
                </View>
                <View style={styles.profileActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => router.push({ pathname: '/(parent)/profile/[id]/library', params: { id: profile.id } })}
                    accessibilityRole="button"
                    accessibilityLabel={`Open ${profile.name}'s video library`}
                  >
                    <Text style={styles.actionButtonText}>Library</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.actionButtonSecondary]}
                    onPress={() => router.push({ pathname: '/(parent)/profile/[id]/settings', params: { id: profile.id } })}
                    accessibilityRole="button"
                    accessibilityLabel={`Open ${profile.name}'s settings`}
                  >
                    <Text style={styles.actionButtonSecondaryText}>Settings</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}

          <TouchableOpacity
            style={styles.addKidButton}
            onPress={() => router.push('/(parent)/onboarding/add-kid')}
            accessibilityRole="button"
            accessibilityLabel="Add a new kid profile"
          >
            <Text style={styles.addKidButtonText}>+ Add a kid</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
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
  title: { fontSize: font.size.xl, fontWeight: font.weight.bold, color: colors.text },
  signOutText: { color: colors.danger, fontSize: font.size.sm, fontWeight: font.weight.medium },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: space.xl, gap: space.md },
  empty: { alignItems: 'center', paddingVertical: space.xxl },
  emptyText: { color: colors.textMuted, textAlign: 'center' },
  profileCard: {
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    padding: space.lg,
    borderWidth: 1,
    borderColor: colors.bgDim,
    gap: space.md,
  },
  profileInfo: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  profileEmoji: { fontSize: 36 },
  profileName: { fontSize: font.size.md, fontWeight: font.weight.semibold, color: colors.text },
  profileMeta: { fontSize: font.size.sm, color: colors.textMuted, marginTop: 2 },
  profileActions: { flexDirection: 'row', gap: space.sm },
  actionButton: {
    flex: 1, backgroundColor: colors.accent, borderRadius: radius.md,
    paddingVertical: space.sm, alignItems: 'center',
  },
  actionButtonText: { color: '#fff', fontWeight: font.weight.medium, fontSize: font.size.sm },
  actionButtonSecondary: { backgroundColor: colors.bgDim },
  actionButtonSecondaryText: { color: colors.text, fontWeight: font.weight.medium, fontSize: font.size.sm },
  addKidButton: {
    marginTop: space.lg, borderRadius: radius.pill, paddingVertical: space.md,
    alignItems: 'center', borderWidth: 2, borderColor: colors.accent,
  },
  addKidButtonText: { color: colors.accent, fontWeight: font.weight.semibold },
});
