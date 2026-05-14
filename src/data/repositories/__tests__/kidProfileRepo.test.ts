import { listProfiles, createProfile } from '../kidProfileRepo';
import { supabase } from '@/data/supabase';
jest.mock('@/data/supabase', () => {
  const chain: any = {};
  chain.from = jest.fn(() => chain);
  chain.select = jest.fn(() => chain);
  chain.insert = jest.fn(() => chain);
  chain.update = jest.fn(() => chain);
  chain.delete = jest.fn(() => chain);
  chain.order = jest.fn(() => chain);
  chain.single = jest.fn();
  chain.eq = jest.fn(() => chain);
  return { supabase: chain };
});
describe('kidProfileRepo', () => {
  beforeEach(() => jest.clearAllMocks());
  it('listProfiles selects from kid_profiles', async () => {
    (supabase as any).order.mockResolvedValue({ data: [], error: null });
    await listProfiles();
    expect((supabase as any).from).toHaveBeenCalledWith('kid_profiles');
  });
  it('createProfile inserts a row', async () => {
    (supabase as any).single.mockResolvedValue({ data: { id: 'x' }, error: null });
    await createProfile({ name: 'A', avatarEmoji: '🦊', age: 5, dailyLimitMinutes: 30, unlockGesture: 'long_press_3s' });
    expect((supabase as any).from).toHaveBeenCalledWith('kid_profiles');
    expect((supabase as any).insert).toHaveBeenCalled();
  });
});
