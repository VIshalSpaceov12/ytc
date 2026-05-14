import { createCornerTriangleTracker } from '../cornerTriangle';

describe('corner-triangle', () => {
  jest.useFakeTimers();
  beforeEach(() => jest.setSystemTime(new Date(0)));

  it('fires on TL → TR → BC within 3s', () => {
    const onComplete = jest.fn();
    const t = createCornerTriangleTracker(3000, onComplete);
    t.tap('TL'); jest.advanceTimersByTime(500);
    t.tap('TR'); jest.advanceTimersByTime(500);
    t.tap('BC');
    expect(onComplete).toHaveBeenCalled();
  });

  it('out-of-order taps reset', () => {
    const onComplete = jest.fn();
    const t = createCornerTriangleTracker(3000, onComplete);
    t.tap('TR'); t.tap('TL'); t.tap('BC');
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('expires after 3s', () => {
    const onComplete = jest.fn();
    const t = createCornerTriangleTracker(3000, onComplete);
    t.tap('TL'); jest.advanceTimersByTime(3001);
    t.tap('TR'); t.tap('BC');
    expect(onComplete).not.toHaveBeenCalled();
  });
});
