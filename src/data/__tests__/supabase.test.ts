import { supabase } from '../supabase';
describe('supabase client', () => {
  it('exposes auth + from()', () => {
    expect(typeof supabase.auth).toBe('object');
    expect(typeof supabase.from).toBe('function');
  });
});
