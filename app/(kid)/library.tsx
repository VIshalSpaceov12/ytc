import React from 'react';
import {
  View, Text, TouchableOpacity, FlatList, StyleSheet, Image, Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors, space, radius, font } from '@/core/theme';
import { useVideos } from '@/data/queries/videos';
import { useProfiles } from '@/data/queries/profiles';
import { TimeRemainingBanner } from '@/features/kid-zone/TimeRemainingBanner';
import { EmptyState } from '@/features/kid-zone/EmptyState';
import type { Video } from '@/shared/types/video';

const TILE_SIZE = 160;

export default function KidLibraryScreen() {
  const router = useRouter();
  const { profileId } = useLocalSearchParams<{ profileId: string }>();
  const pid = profileId ?? '';
  const { data: videos, isLoading } = useVideos(pid);
  const { data: profiles } = useProfiles();
  const profile = (profiles ?? []).find((p) => p.id === pid);

  const handleLeave = () => {
    Alert.alert(
      'Leave kid zone?',
      'You will be taken back to the profile picker.',
      [
        { text: 'Stay', style: 'cancel' },
        {
          text: 'Leave',
          onPress: () => router.replace('/(parent)/profile-picker'),
        },
      ],
    );
  };

  const renderTile = ({ item }: { item: Video }) => (
    <TouchableOpacity
      style={styles.tile}
      onPress={() =>
        router.push({ pathname: '/(kid)/player' as any, params: { videoId: item.id, profileId: pid } })
      }
      activeOpacity={0.8}
    >
      {item.thumbnailUrl ? (
        <Image source={{ uri: item.thumbnailUrl }} style={styles.tileImage} resizeMode="cover" />
      ) : (
        <View style={[styles.tileImage, styles.tileImagePlaceholder]}>
          <Text style={styles.tilePlay}>▶</Text>
        </View>
      )}
      <Text style={styles.tileTitle} numberOfLines={2}>{item.title}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <TimeRemainingBanner dailyLimitMinutes={profile?.dailyLimitMinutes ?? 0} />

      <View style={styles.header}>
        <Text style={styles.greeting}>
          {profile ? `Hi, ${profile.name}! 👋` : 'Your videos'}
        </Text>
        <TouchableOpacity onPress={handleLeave} style={styles.leaveButton}>
          <Text style={styles.leaveButtonText}>⬅ Leave</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <Text style={styles.loadingText}>Loading videos…</Text>
        </View>
      ) : (videos ?? []).length === 0 ? (
        <EmptyState />
      ) : (
        <FlatList
          data={videos}
          keyExtractor={(item) => item.id}
          renderItem={renderTile}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
        />
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
    paddingVertical: space.md,
  },
  greeting: { fontSize: font.size.lg, fontWeight: font.weight.bold, color: colors.text },
  leaveButton: {
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.md,
    backgroundColor: colors.bgDim,
  },
  leaveButtonText: { color: colors.textMuted, fontSize: font.size.sm },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: colors.textMuted },
  row: { justifyContent: 'space-around', paddingHorizontal: space.md },
  listContent: { paddingBottom: space.xxl },
  tile: {
    width: TILE_SIZE,
    marginVertical: space.sm,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.bgDim,
  },
  tileImage: { width: TILE_SIZE, height: TILE_SIZE * 0.6 },
  tileImagePlaceholder: { justifyContent: 'center', alignItems: 'center' },
  tilePlay: { fontSize: 32, color: colors.textMuted },
  tileTitle: {
    padding: space.sm,
    fontSize: font.size.xs,
    color: colors.text,
    fontWeight: font.weight.medium,
  },
});
