module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
        alias: {
          '@api':           './src/api',
          '@assets':        './src/assets',
          '@core':          './src/core',
          '@features':      './src/features',
          '@navigation':    './src/navigation',
          '@services':      './src/services',
          '@shared':        './src/shared',
          '@store':         './src/store',

          // Compat Aliases (Legacy support)
          '@components':    './src/shared/components',
          '@hooks':         './src/shared/hooks',
          '@utils':         './src/shared/utils',
          '@types':         './src/shared/types',
          '@theme':         './src/core/theme',
          '@config':        './src/core/config',
          '@constants':     './src/core/constants',
          '@localization':  './src/core/localization',
        },
      },
    ],
    'react-native-reanimated/plugin',
  ],
};
