export type Video = {
  id: string; profileId: string; youtubeId: string; title: string;
  thumbnailUrl: string | null; durationSec: number | null;
  sortOrder: number; updatedAt: string;
};
export type NewVideo = Pick<Video, 'profileId' | 'youtubeId' | 'title' | 'thumbnailUrl' | 'durationSec'>;
