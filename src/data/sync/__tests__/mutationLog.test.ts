import { resolveConflict } from '../mutationLog';

describe('resolveConflict', () => {
  it('prefers higher updatedAt', () => {
    const a = { id: '1', name: 'A', updatedAt: '2026-04-13T10:00:00Z' };
    const b = { id: '1', name: 'B', updatedAt: '2026-04-13T11:00:00Z' };
    expect(resolveConflict(a, b)).toEqual(b);
  });

  it('returns the first if both have same updatedAt', () => {
    const a = { id: '1', name: 'A', updatedAt: '2026-04-13T10:00:00Z' };
    const b = { id: '1', name: 'B', updatedAt: '2026-04-13T10:00:00Z' };
    expect(resolveConflict(a, b)).toEqual(a);
  });
});
