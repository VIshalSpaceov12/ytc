import { captureEvent } from '../telemetry';
import * as Sentry from '@sentry/react-native';
jest.mock('@sentry/react-native', () => ({ addBreadcrumb: jest.fn(), init: jest.fn() }));

describe('captureEvent', () => {
  it('scrubs PII fields in data payload', () => {
    captureEvent('test', { email: 'a@b.com', other: 'ok' });
    expect((Sentry.addBreadcrumb as jest.Mock).mock.calls[0][0].data).toEqual({
      email: '[scrubbed]',
      other: 'ok',
    });
  });
});
