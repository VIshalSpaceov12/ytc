import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Kids YouTube',
  slug: 'ytc',
  scheme: 'ytc',
  version: '0.1.0',
  orientation: 'default',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  ios: {
    bundleIdentifier: 'app.ytc.kids',
    supportsTablet: true,
    infoPlist: {
      UIBackgroundModes: [],
    },
  },
  android: {
    package: 'app.ytc.kids',
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#ffffff',
    },
    edgeToEdgeEnabled: true,
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    ['expo-screen-orientation', { initialOrientation: 'DEFAULT' }],
    'expo-sqlite',
  ],
  experiments: {
    typedRoutes: true,
  },
});
