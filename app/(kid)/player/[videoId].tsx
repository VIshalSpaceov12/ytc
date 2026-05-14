import { useLocalSearchParams, router } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { VideoPlayerShell } from '@/features/player/VideoPlayerShell';
import { useVideos } from '@/data/queries/videos';
import { useProfiles } from '@/data/queries/profiles';

export default function Player() {
  const { videoId, profileId } = useLocalSearchParams<{ videoId: string; profileId: string }>();
  const { data: videos } = useVideos(profileId ?? '');
  const { data: profiles } = useProfiles();
  const video = videos?.find((v) => v.id === videoId);
  const profile = profiles?.find((p) => p.id === profileId);

  if (!video || !profile) return <View style={{ flex: 1 }}><ActivityIndicator /></View>;

  return (
    <VideoPlayerShell
      youtubeId={video.youtubeId}
      gesture={profile.unlockGesture}
      onBack={() => router.back()}
    />
  );
}
