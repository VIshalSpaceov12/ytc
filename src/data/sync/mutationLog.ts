export type Versioned = { updatedAt: string };

export function resolveConflict<T extends Versioned>(a: T, b: T): T {
  return new Date(b.updatedAt) > new Date(a.updatedAt) ? b : a;
}
