import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert, TextInput, Image,
} from 'react-native';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import { useActionSheet } from '@expo/react-native-action-sheet';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors, space, radius, font } from '@/core/theme';
import { useVideos, useRenameVideo, useDeleteVideo, useReorderVideos } from '@/data/queries/videos';
import type { Video } from '@/shared/types/video';

export default function LibraryScreen() {
  const router = useRouter();
  const { id: profileId } = useLocalSearchParams<{ id: string }>();
  const pid = profileId ?? '';
  const { data: videos, isLoading } = useVideos(pid);
  const renameVideo = useRenameVideo(pid);
  const deleteVideo = useDeleteVideo(pid);
  const reorderVideos = useReorderVideos(pid);
  const { showActionSheetWithOptions } = useActionSheet();

  const [localVideos, setLocalVideos] = useState<Video[] | null>(null);
  const displayVideos = localVideos ?? videos ?? [];

  const handleLongPress = (item: Video) => {
    showActionSheetWithOptions(
      {
        options: ['Rename', 'Delete', 'Cancel'],
        destructiveButtonIndex: 1,
        cancelButtonIndex: 2,
        title: item.title,
      },
      (index) => {
        if (index === 0) {
          Alert.prompt(
            'Rename video',
            undefined,
            (newTitle) => {
              if (newTitle?.trim()) {
                renameVideo.mutate({ id: item.id, title: newTitle.trim() });
              }
            },
            'plain-text',
            item.title,
          );
        } else if (index === 1) {
          Alert.alert(
            'Delete video',
            `Remove "${item.title}" from the library?`,
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete',
                style: 'destructive',
                onPress: () => deleteVideo.mutate(item.id),
              },
            ],
          );
        }
      },
    );
  };

  const handleDragEnd = ({ data }: { data: Video[] }) => {
    setLocalVideos(data);
    reorderVideos.mutate(data.map((v) => v.id));
  };

  const renderItem = ({ item, drag, isActive }: RenderItemParams<Video>) => (
    <TouchableOpacity
      style={[styles.videoRow, isActive && styles.videoRowActive]}
      onLongPress={() => handleLongPress(item)}
      onPressIn={drag}
      delayLongPress={200}
      activeOpacity={0.8}
    >
      {item.thumbnailUrl ? (
        <Image source={{ uri: item.thumbnailUrl }} style={styles.thumbnail} />
      ) : (
        <View style={[styles.thumbnail, styles.thumbnailPlaceholder]}>
          <Text style={styles.thumbnailPlaceholderText}>▶</Text>
        </View>
      )}
      <Text style={styles.videoTitle} numberOfLines={2}>{item.title}</Text>
      <Text style={styles.dragHandle}>⠿</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Library</Text>
        <TouchableOpacity onPress={() => router.push({ pathname: '/(parent)/profile/[id]/add-video', params: { id: pid } })}>
          <Text style={styles.addButton}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <Text style={styles.loadingText}>Loading…</Text>
        </View>
      ) : displayVideos.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No videos yet. Tap + Add to get started.</Text>
        </View>
      ) : (
        <DraggableFlatList
          data={displayVideos}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          onDragEnd={handleDragEnd}
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
    paddingTop: space.xxl,
    paddingBottom: space.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.bgDim,
  },
  backButton: { color: colors.accent, fontSize: font.size.md },
  headerTitle: { fontSize: font.size.lg, fontWeight: font.weight.bold, color: colors.text },
  addButton: { color: colors.accent, fontSize: font.size.md, fontWeight: font.weight.semibold },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: space.xl },
  loadingText: { color: colors.textMuted },
  emptyText: { color: colors.textMuted, textAlign: 'center', fontSize: font.size.md },
  listContent: { padding: space.md },
  videoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    marginBottom: space.sm,
    padding: space.sm,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1,
  },
  videoRowActive: { backgroundColor: colors.bgDim, opacity: 0.9 },
  thumbnail: { width: 80, height: 52, borderRadius: radius.sm, marginRight: space.md },
  thumbnailPlaceholder: { backgroundColor: colors.bgDim, justifyContent: 'center', alignItems: 'center' },
  thumbnailPlaceholderText: { color: colors.textMuted, fontSize: font.size.md },
  videoTitle: { flex: 1, fontSize: font.size.sm, color: colors.text },
  dragHandle: { color: colors.textMuted, fontSize: 20, paddingLeft: space.sm },
});
