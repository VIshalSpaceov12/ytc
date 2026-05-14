import { usePlayerStore } from '../playerStore';

describe('playerStore', () => {
  beforeEach(() => usePlayerStore.setState({ isLocked: false, overlayVisible: false, currentSec: 0, durationSec: 0 }));

  it('toggle lock', () => {
    usePlayerStore.getState().lock();
    expect(usePlayerStore.getState().isLocked).toBe(true);
    usePlayerStore.getState().unlock();
    expect(usePlayerStore.getState().isLocked).toBe(false);
  });

  it('locking hides overlay', () => {
    usePlayerStore.setState({ overlayVisible: true });
    usePlayerStore.getState().lock();
    expect(usePlayerStore.getState().overlayVisible).toBe(false);
  });

  it('showOverlay no-op when locked', () => {
    usePlayerStore.getState().lock();
    usePlayerStore.getState().showOverlay();
    expect(usePlayerStore.getState().overlayVisible).toBe(false);
  });
});
