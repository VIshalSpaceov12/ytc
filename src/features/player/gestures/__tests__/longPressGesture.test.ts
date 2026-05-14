import { createLongPressTracker } from '../longPressGesture';

describe('long-press tracker', () => {
  jest.useFakeTimers();

  it('fires onComplete after holdMs', () => {
    const onComplete = jest.fn();
    const t = createLongPressTracker(3000, onComplete);
    t.start();
    jest.advanceTimersByTime(2999);
    expect(onComplete).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('cancel before holdMs prevents fire', () => {
    const onComplete = jest.fn();
    const t = createLongPressTracker(3000, onComplete);
    t.start();
    jest.advanceTimersByTime(1000);
    t.cancel();
    jest.advanceTimersByTime(5000);
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('reports progress between 0..1', () => {
    const t = createLongPressTracker(3000, () => {});
    t.start();
    jest.advanceTimersByTime(1500);
    expect(t.progress()).toBeCloseTo(0.5, 1);
  });
});
