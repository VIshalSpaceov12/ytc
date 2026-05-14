import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image, ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors, space, radius, font } from '@/core/theme';
import { useAddVideo } from '@/data/queries/videos';
import { parseYoutubeUrl, thumbnailUrl } from '@/shared/utils/youtubeUrlParser';

export default function AddVideoScreen() {
  const router = useRouter();
  const { id: profileId } = useLocalSearchParams<{ id: string }>();
  const addVideo = useAddVideo(profileId ?? '');

  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [youtubeId, setYoutubeId] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleParseUrl = () => {
    const parsed = parseYoutubeUrl(url.trim());
    if (!parsed) {
      Alert.alert('Invalid URL', 'Please paste a valid YouTube link.');
      setYoutubeId(null);
      setPreview(null);
      return;
    }
    setYoutubeId(parsed);
    setPreview(thumbnailUrl(parsed));
    if (!title) {
      setTitle('');
    }
  };

  const handleSave = async () => {
    if (!profileId) return;
    if (!youtubeId) {
      Alert.alert('Parse URL first', 'Please paste and validate a YouTube URL.');
      return;
    }
    const trimmedTitle = title.trim() || 'Untitled video';
    try {
      await addVideo.mutateAsync({
        profileId,
        youtubeId,
        title: trimmedTitle,
        thumbnailUrl: preview,
        durationSec: null,
      });
      router.back();
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Could not save video.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add a video</Text>

      <Text style={styles.label}>YouTube URL</Text>
      <View style={styles.urlRow}>
        <TextInput
          style={styles.urlInput}
          placeholder="Paste a YouTube link"
          placeholderTextColor={colors.textMuted}
          value={url}
          onChangeText={setUrl}
          autoCapitalize="none"
          keyboardType="url"
          autoCorrect={false}
        />
        <TouchableOpacity style={styles.parseButton} onPress={handleParseUrl}>
          <Text style={styles.parseButtonText}>Check</Text>
        </TouchableOpacity>
      </View>

      {preview && (
        <View style={styles.previewContainer}>
          <Image source={{ uri: preview }} style={styles.thumbnail} resizeMode="cover" />
          {youtubeId && (
            <Text style={styles.videoId} numberOfLines={1}>ID: {youtubeId}</Text>
          )}
        </View>
      )}

      <Text style={styles.label}>Title</Text>
      <TextInput
        style={styles.input}
        placeholder="Video title"
        placeholderTextColor={colors.textMuted}
        value={title}
        onChangeText={setTitle}
        maxLength={100}
      />

      <TouchableOpacity
        style={[styles.button, (!youtubeId || addVideo.isPending) && styles.buttonDisabled]}
        onPress={handleSave}
        disabled={!youtubeId || addVideo.isPending}
      >
        {addVideo.isPending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Save video</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: space.xl },
  title: { fontSize: font.size.xl, fontWeight: font.weight.bold, color: colors.text, marginBottom: space.xl },
  label: { fontSize: font.size.sm, fontWeight: font.weight.medium, color: colors.textMuted, marginBottom: space.sm, marginTop: space.lg },
  urlRow: { flexDirection: 'row', gap: space.sm },
  urlInput: {
    flex: 1,
    borderWidth: 1, borderColor: colors.bgDim, borderRadius: radius.md,
    padding: space.md, fontSize: font.size.sm, color: colors.text, backgroundColor: colors.bgDim,
  },
  parseButton: {
    backgroundColor: colors.accent, borderRadius: radius.md,
    paddingHorizontal: space.lg, justifyContent: 'center',
  },
  parseButtonText: { color: '#fff', fontWeight: font.weight.semibold, fontSize: font.size.sm },
  previewContainer: { marginTop: space.md, alignItems: 'center' },
  thumbnail: { width: '100%', height: 180, borderRadius: radius.md },
  videoId: { fontSize: font.size.xs, color: colors.textMuted, marginTop: space.xs },
  input: {
    borderWidth: 1, borderColor: colors.bgDim, borderRadius: radius.md,
    padding: space.md, fontSize: font.size.md, color: colors.text, backgroundColor: colors.bgDim,
  },
  button: {
    marginTop: space.xxl, backgroundColor: colors.accent, borderRadius: radius.pill,
    paddingVertical: space.md + 2, alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontSize: font.size.md, fontWeight: font.weight.semibold },
});
