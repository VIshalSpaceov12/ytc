export function createLongPressTracker(holdMs: number, onComplete: () => void) {
  let startedAt = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;

  return {
    start() {
      startedAt = Date.now();
      timer = setTimeout(() => { onComplete(); timer = null; }, holdMs);
    },
    cancel() {
      if (timer) { clearTimeout(timer); timer = null; }
      startedAt = 0;
    },
    progress(): number {
      if (!startedAt) return 0;
      return Math.min(1, (Date.now() - startedAt) / holdMs);
    },
    isActive() { return timer !== null; },
  };
}
