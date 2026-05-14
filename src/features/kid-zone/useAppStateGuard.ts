import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';

type Options = {
  /** Called when the app goes to background while in the kid zone */
  onBackground: () => void;
};

/**
 * Guards the kid zone by listening for AppState changes.
 * Calls `onBackground` when the app moves to background/inactive state.
 * Also triggers immediately if the app starts in background (cold-start guard).
 */
export function useAppStateGuard({ onBackground }: Options): void {
  const appState = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    // Cold-start guard: if app starts in background, exit immediately
    if (appState.current !== 'active') {
      onBackground();
    }

    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      const wasActive = appState.current === 'active';
      const isNowInBackground = nextState === 'background' || nextState === 'inactive';
      if (wasActive && isNowInBackground) {
        onBackground();
      }
      appState.current = nextState;
    });

    return () => subscription.remove();
  }, [onBackground]);
}
