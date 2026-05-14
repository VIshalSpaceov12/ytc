import 'react-native-gesture-handler/jestSetup';

jest.mock('react-native-reanimated', () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('react-native-reanimated/mock'),
);

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('expo-localization', () => ({
  getCalendars: () => [{ timeZone: 'America/New_York' }],
  getLocales: () => [{ languageCode: 'en', regionCode: 'US' }],
  locale: 'en-US',
}));
