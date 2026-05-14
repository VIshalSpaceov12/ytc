import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listProfiles, createProfile, updateProfile, deleteProfile } from '@/data/repositories/kidProfileRepo';
import type { NewKidProfile } from '@/shared/types/kidProfile';
const KEY = ['profiles'] as const;
export function useProfiles() { return useQuery({ queryKey: KEY, queryFn: listProfiles }); }
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
