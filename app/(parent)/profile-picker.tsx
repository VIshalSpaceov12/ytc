import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors, space, font, radius } from '@/core/theme';
import { useProfiles } from '@/data/queries/profiles';
import { AvatarTile } from '@/features/profile-picker/AvatarTile';
import { ForgotGestureLink } from '@/features/player/ForgotGestureLink';
import { UnlockGestureDetector } from '@/features/player/UnlockGestureDetector';
import { usePlayerStore } from '@/features/player/playerStore';

export default function ProfilePickerScreen() {
  const router = useRouter();
  const { data: profiles, isLoading } = useProfiles();
  const [showParentGate, setShowParentGate] = useState(false);
  const isLocked = usePlayerStore((s) => s.isLocked);
  const lock = usePlayerStore((s) => s.lock);

  useEffect(() => {
    if (showParentGate && !isLocked) {
      setShowParentGate(false);
      router.push('/(parent)/dashboard' as any);
    }
  }, [showParentGate, isLocked, router]);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{"Who's watching?"}</Text>

      <ScrollView contentContainerStyle={styles.grid}>
        {(profiles ?? []).map((profile) => (
          <AvatarTile
            key={profile.id}
            profile={profile}
            onPress={() =>
              router.push({ pathname: '/(kid)/library', params: { profileId: profile.id } })
            }
          />
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/(parent)/onboarding/add-kid')}
        >
          <Text style={styles.addButtonText}>+ Add a kid</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.manageButton}
          onPress={() => { lock(); setShowParentGate(true); }}
        >
          <Text style={styles.manageButtonText}>Manage profiles</Text>
        </TouchableOpacity>
      </View>

      {showParentGate && (
        <View style={StyleSheet.absoluteFill as any}>
          <View style={{ flex: 1, backgroundColor: '#000' }}>
            <UnlockGestureDetector gesture={'long_press_3s'} />
          </View>
          <ForgotGestureLink visible={true} onReauth={() => {
            setShowParentGate(false);
            router.push('/(parent)/dashboard' as any);
          }} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: {
    fontSize: font.size.xl,
    fontWeight: font.weight.bold,
    color: colors.text,
    textAlign: 'center',
    paddingTop: space.xxl,
    paddingBottom: space.lg,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: space.lg,
    paddingBottom: space.xl,
  },
  footer: {
    padding: space.xl,
    gap: space.md,
    borderTopWidth: 1,
    borderTopColor: colors.bgDim,
  },
  addButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingVertical: space.md,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: font.size.md,
    fontWeight: font.weight.semibold,
  },
  manageButton: {
    alignItems: 'center',
    paddingVertical: space.sm,
  },
  manageButtonText: {
    color: colors.textMuted,
    fontSize: font.size.sm,
  },
});
