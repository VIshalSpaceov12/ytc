import { signInWithPassword } from '../useSignIn';
import { supabase } from '@/data/supabase';
jest.mock('@/data/supabase', () => ({
  supabase: { auth: { signInWithPassword: jest.fn() } },
}));

describe('signInWithPassword', () => {
  it('forwards to supabase.auth.signInWithPassword', async () => {
    (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({ data: {}, error: null });
    await signInWithPassword('a@b.com', 'pw');
    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'a@b.com',
      password: 'pw',
    });
  });

  it('throws on supabase error', async () => {
    (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
      data: null,
      error: { message: 'bad' },
    });
    await expect(signInWithPassword('a', 'b')).rejects.toThrow('bad');
  });
});
