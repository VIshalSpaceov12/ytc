import * as Sentry from '@sentry/react-native';
import { env } from './env';
const PII_KEYS = ['email', 'name', 'displayName', 'title', 'youtube_id'];
function scrub<T>(value: T): T {
  if (!value || typeof value !== 'object') return value;
  const cloned: any = Array.isArray(value) ? [...value] : { ...value };
  for (const k of Object.keys(cloned)) {
    if (PII_KEYS.includes(k)) cloned[k] = '[scrubbed]';
    else cloned[k] = scrub(cloned[k]);
  }
  return cloned;
}
export function initTelemetry() {
  if (!env.sentryDsn) return;
  Sentry.init({
    dsn: env.sentryDsn,
    sendDefaultPii: false,
    beforeSend: (event) => scrub(event),
    beforeBreadcrumb: (b) => scrub(b),
  });
}
export const captureEvent = (name: string, data?: Record<string, unknown>) => {
  const breadcrumb: Parameters<typeof Sentry.addBreadcrumb>[0] = { category: 'app', message: name };
  if (data !== undefined) breadcrumb.data = scrub(data);
  Sentry.addBreadcrumb(breadcrumb);
};
