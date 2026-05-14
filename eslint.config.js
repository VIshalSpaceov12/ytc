const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier/flat');
const typescriptEslint = require('@typescript-eslint/eslint-plugin');

module.exports = [
  ...expoConfig.map((config) => {
    // Inject react version setting so eslint-plugin-react can detect it
    if (config.settings && config.settings.react !== undefined) {
      return config;
    }
    if (config.plugins && config.plugins.react) {
      return {
        ...config,
        settings: {
          ...config.settings,
          react: { version: 'detect' },
        },
      };
    }
    return config;
  }),
  prettierConfig,
  {
    files: ['**/*.ts', '**/*.tsx'],
    plugins: {
      '@typescript-eslint': typescriptEslint,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    ignores: ['node_modules/**', '.expo/**', 'ios/**', 'android/**'],
  },
];
