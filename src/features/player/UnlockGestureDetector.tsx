import { useRef, useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { usePlayerStore } from './playerStore';
import { createLongPressTracker } from './gestures/longPressGesture';
import { createDoubleTapHoldTracker } from './gestures/doubleTapHold';
import { createCornerTriangleTracker, type Corner } from './gestures/cornerTriangle';
import { ProgressRing } from './ProgressRing';
import type { UnlockGesture } from '@/shared/types/kidProfile';

type Tracker = {
  start?: () => void; cancel?: () => void; progress?: () => number;
  tap?: (corner?: Corner) => void; holdStart?: () => void; holdEnd?: () => void;
};

function makeTracker(gesture: UnlockGesture, onUnlock: () => void): Tracker {
  if (gesture === 'long_press_3s') return createLongPressTracker(3000, onUnlock) as Tracker;
  if (gesture === 'long_press_5s') return createLongPressTracker(5000, onUnlock) as Tracker;
  if (gesture === 'double_tap_hold') return createDoubleTapHoldTracker(2000, onUnlock) as Tracker;
  return createCornerTriangleTracker(3000, onUnlock) as Tracker;
}

function cornerOf(x: number, y: number, w: number, h: number): Corner | null {
  const ZONE = 80;
  if (x < ZONE && y < ZONE) return 'TL';
  if (x > w - ZONE && y < ZONE) return 'TR';
  if (Math.abs(x - w / 2) < ZONE && y > h - ZONE) return 'BC';
  return null;
}

export function UnlockGestureDetector({ gesture }: { gesture: UnlockGesture }) {
  const unlock = usePlayerStore((s) => s.unlock);
  const trackerRef = useRef<Tracker>(makeTracker(gesture, unlock));
  const [progress, setProgress] = useState(0);
  const [touch, setTouch] = useState<{ x: number; y: number } | null>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { width, height } = useWindowDimensions();

  // Re-make tracker if gesture changes
  if (!trackerRef.current) trackerRef.current = makeTracker(gesture, unlock);

  const handlePressIn = (e: any) => {
    const { locationX, locationY, pageX, pageY } = e.nativeEvent;
    setTouch({ x: pageX, y: pageY });
    if (gesture.startsWith('long_press_')) {
      trackerRef.current.start?.();
      progressIntervalRef.current = setInterval(() => {
        const p = trackerRef.current.progress?.() ?? 0;
        setProgress(p);
        if (p >= 1 && progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
      }, 50);
    } else if (gesture === 'double_tap_hold') {
      trackerRef.current.tap?.();
      trackerRef.current.holdStart?.();
    } else if (gesture === 'corner_triangle') {
      const corner = cornerOf(locationX, locationY, width, height);
      if (corner) trackerRef.current.tap?.(corner);
    }
  };

  const handlePressOut = () => {
    setTouch(null);
    setProgress(0);
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    if (gesture.startsWith('long_press_')) trackerRef.current.cancel?.();
    if (gesture === 'double_tap_hold') trackerRef.current.holdEnd?.();
  };

  return (
    <Pressable style={StyleSheet.absoluteFill} onPressIn={handlePressIn} onPressOut={handlePressOut}>
      {touch && gesture.startsWith('long_press_') && (
        <ProgressRing progress={progress} x={touch.x} y={touch.y} />
      )}
    </Pressable>
  );
}
