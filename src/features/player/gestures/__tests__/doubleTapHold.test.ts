import { createDoubleTapHoldTracker } from '../doubleTapHold';

describe('double-tap-hold', () => {
  jest.useFakeTimers();

  it('fires after 2nd tap held 2000ms', () => {
    const onComplete = jest.fn();
    const t = createDoubleTapHoldTracker(2000, onComplete);
    t.tap();
    t.tap();
    t.holdStart();
    jest.advanceTimersByTime(2000);
    expect(onComplete).toHaveBeenCalled();
  });

  it('does not fire if only single tap', () => {
    const onComplete = jest.fn();
    const t = createDoubleTapHoldTracker(2000, onComplete);
    t.tap();
    t.holdStart();
    jest.advanceTimersByTime(2000);
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('hold release cancels', () => {
    const onComplete = jest.fn();
    const t = createDoubleTapHoldTracker(2000, onComplete);
    t.tap(); t.tap(); t.holdStart();
    jest.advanceTimersByTime(1000);
    t.holdEnd();
    jest.advanceTimersByTime(5000);
    expect(onComplete).not.toHaveBeenCalled();
  });
});
