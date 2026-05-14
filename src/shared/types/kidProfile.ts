export type UnlockGesture = 'long_press_3s' | 'long_press_5s' | 'double_tap_hold' | 'corner_triangle';
export type KidProfile = {
  id: string; parentId: string; name: string; avatarEmoji: string;
  age: number; dailyLimitMinutes: number; unlockGesture: UnlockGesture; updatedAt: string;
};
export type NewKidProfile = Omit<KidProfile, 'id' | 'parentId' | 'updatedAt'>;
