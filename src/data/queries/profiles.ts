import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listProfiles, createProfile, updateProfile, deleteProfile } from '@/data/repositories/kidProfileRepo';
import type { NewKidProfile } from '@/shared/types/kidProfile';
import { db } from '@/data/db/client';
import { kidProfiles as kpTable } from '@/data/db/schema';

const KEY = ['profiles'] as const;

export function useProfiles() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const rows = await listProfiles();
      for (const r of rows) {
        try {
          (db.insert(kpTable).values({
            id: r.id,
            parentId: r.parentId,
            name: r.name,
            avatarEmoji: r.avatarEmoji,
            age: r.age,
            dailyLimitMinutes: r.dailyLimitMinutes,
            unlockGesture: r.unlockGesture,
            updatedAt: Date.parse(r.updatedAt),
          }) as any).onConflictDoUpdate({
            target: kpTable.id,
            set: {
              name: r.name,
              avatarEmoji: r.avatarEmoji,
              age: r.age,
              dailyLimitMinutes: r.dailyLimitMinutes,
              unlockGesture: r.unlockGesture,
              updatedAt: Date.parse(r.updatedAt),
            },
          }).run();
        } catch { /* cache write best-effort */ }
      }
      return rows;
    },
  });
}

export function useCreateProfile() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (p: NewKidProfile) => createProfile(p), onSuccess: () => qc.invalidateQueries({ queryKey: KEY }) });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<NewKidProfile> }) => updateProfile(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteProfile() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => deleteProfile(id), onSuccess: () => qc.invalidateQueries({ queryKey: KEY }) });
}
