export function createDoubleTapHoldTracker(holdMs: number, onComplete: () => void) {
  let tapCount = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;
  const tapWindowMs = 400;
  let tapResetTimer: ReturnType<typeof setTimeout> | null = null;

  return {
    tap() {
      tapCount += 1;
      if (tapResetTimer) clearTimeout(tapResetTimer);
      tapResetTimer = setTimeout(() => { tapCount = 0; }, tapWindowMs);
    },
    holdStart() {
      if (tapCount < 2) return;
      timer = setTimeout(() => { onComplete(); timer = null; }, holdMs);
    },
    holdEnd() {
      if (timer) { clearTimeout(timer); timer = null; }
      tapCount = 0;
    },
  };
}
