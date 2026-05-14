export type Corner = 'TL' | 'TR' | 'BC';
const SEQUENCE: Corner[] = ['TL', 'TR', 'BC'];

export function createCornerTriangleTracker(windowMs: number, onComplete: () => void) {
  let progress = 0;
  let startedAt = 0;

  return {
    tap(corner: Corner) {
      const now = Date.now();
      if (progress === 0) startedAt = now;
      if (now - startedAt > windowMs) {
        progress = 0;
        startedAt = now;
      }
      if (corner === SEQUENCE[progress]) {
        progress += 1;
        if (progress === SEQUENCE.length) { onComplete(); progress = 0; startedAt = 0; }
      } else {
        progress = 0;
        startedAt = 0;
      }
    },
  };
}
