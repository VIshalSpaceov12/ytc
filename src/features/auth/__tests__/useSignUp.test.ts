import { signUp } from '../useSignUp';
import { supabase } from '@/data/supabase';
jest.mock('@/data/supabase', () => ({
  supabase: { auth: { signUp: jest.fn() } },
}));

describe('signUp', () => {
  it('calls supabase signUp with email+password', async () => {
    (supabase.auth.signUp as jest.Mock).mockResolvedValue({ data: {}, error: null });
    await signUp('a@b.com', 'pw12345!');
    expect(supabase.auth.signUp).toHaveBeenCalledWith({ email: 'a@b.com', password: 'pw12345!' });
  });

  it('throws on weak-password error', async () => {
    (supabase.auth.signUp as jest.Mock).mockResolvedValue({
      data: null, error: { message: 'Password should be at least 6 characters' },
    });
    await expect(signUp('a@b.com', 'x')).rejects.toThrow(/Password/);
  });
});
