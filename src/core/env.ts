const required = (key: string, value: string | undefined): string => {
  if (!value) throw new Error(`Missing env var ${key}`);
  return value;
};

export const env = {
  supabaseUrl: required('EXPO_PUBLIC_SUPABASE_URL', process.env.EXPO_PUBLIC_SUPABASE_URL),
  supabaseAnonKey: required(
    'EXPO_PUBLIC_SUPABASE_ANON_KEY',
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  ),
  sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN ?? '',
} as const;
