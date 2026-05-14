describe('env', () => {
  const original = process.env;
  afterEach(() => {
    process.env = original;
    jest.resetModules();
  });

  it('throws if SUPABASE_URL is missing', () => {
    process.env = { ...original, EXPO_PUBLIC_SUPABASE_URL: '' };
    expect(() => require('../env')).toThrow(/SUPABASE_URL/);
  });

  it('returns values when present', () => {
    process.env = {
      ...original,
      EXPO_PUBLIC_SUPABASE_URL: 'https://x.supabase.co',
      EXPO_PUBLIC_SUPABASE_ANON_KEY: 'abc',
    };
    const { env } = require('../env');
    expect(env.supabaseUrl).toBe('https://x.supabase.co');
  });
});
