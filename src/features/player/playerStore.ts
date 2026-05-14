import { create } from 'zustand';

type PlayerState = {
  isLocked: boolean;
  overlayVisible: boolean;
  currentSec: number;
  durationSec: number;
  lock: () => void;
  unlock: () => void;
  toggleOverlay: () => void;
  showOverlay: () => void;
  hideOverlay: () => void;
  setProgress: (current: number, duration: number) => void;
};

export const usePlayerStore = create<PlayerState>((set, get) => ({
  isLocked: false,
  overlayVisible: false,
  currentSec: 0,
  durationSec: 0,
  lock: () => set({ isLocked: true, overlayVisible: false }),
  unlock: () => set({ isLocked: false }),
  toggleOverlay: () => {
    if (get().isLocked) return;
    set((s) => ({ overlayVisible: !s.overlayVisible }));
  },
  showOverlay: () => {
    if (get().isLocked) return;
    set({ overlayVisible: true });
  },
  hideOverlay: () => set({ overlayVisible: false }),
  setProgress: (current, duration) => set({ currentSec: current, durationSec: duration }),
}));
