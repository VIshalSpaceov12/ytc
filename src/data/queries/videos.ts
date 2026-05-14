import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listVideos, addVideo, renameVideo, deleteVideo, reorderVideos, moveVideoToProfile,
} from '@/data/repositories/videoRepo';
import type { NewVideo } from '@/shared/types/video';
import { db } from '@/data/db/client';
import { videos as videosTable } from '@/data/db/schema';

function videosKey(profileId: string) {
  return ['videos', profileId] as const;
}

export function useVideos(profileId: string) {
  return useQuery({
    queryKey: videosKey(profileId),
    queryFn: async () => {
      const rows = await listVideos(profileId);
      for (const r of rows) {
        try {
          (db.insert(videosTable).values({
            id: r.id,
            profileId: r.profileId,
            youtubeId: r.youtubeId,
            title: r.title,
            thumbnailUrl: r.thumbnailUrl ?? null,
            durationSec: r.durationSec ?? null,
            sortOrder: r.sortOrder,
            updatedAt: Date.parse(r.updatedAt),
          }) as any).onConflictDoUpdate({
            target: videosTable.id,
            set: {
              title: r.title,
              thumbnailUrl: r.thumbnailUrl ?? null,
              durationSec: r.durationSec ?? null,
              sortOrder: r.sortOrder,
              updatedAt: Date.parse(r.updatedAt),
            },
          }).run();
        } catch { /* cache write best-effort */ }
      }
      return rows;
    },
    enabled: !!profileId,
  });
}

export function useAddVideo(profileId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (video: NewVideo) => addVideo(video),
    onSuccess: () => qc.invalidateQueries({ queryKey: videosKey(profileId) }),
  });
}

export function useRenameVideo(profileId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) => renameVideo(id, title),
    onSuccess: () => qc.invalidateQueries({ queryKey: videosKey(profileId) }),
  });
}

export function useDeleteVideo(profileId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteVideo(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: videosKey(profileId) }),
  });
}

export function useReorderVideos(profileId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderedIds: string[]) => reorderVideos(profileId, orderedIds),
    onSuccess: () => qc.invalidateQueries({ queryKey: videosKey(profileId) }),
  });
}

export function useMoveVideoToProfile(profileId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, newProfileId }: { id: string; newProfileId: string }) =>
      moveVideoToProfile(id, newProfileId),
    onSuccess: () => qc.invalidateQueries({ queryKey: videosKey(profileId) }),
  });
}
