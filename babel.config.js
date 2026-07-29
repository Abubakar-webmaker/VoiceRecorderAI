module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    // Path aliases (@components, @hooks, etc.)
    [
      'module-resolver',
      {
        root: ['./src'],
        extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
        alias: {
          '@assets':      './src/assets',
          '@components':  './src/components',
          '@config':      './src/config',
          '@constants':   './src/constants',
          '@features':    './src/features',
          '@hooks':       './src/hooks',
          '@localization':'./src/localization',
          '@navigation':  './src/navigation',
          '@services':    './src/services',
          '@store':       './src/store',
          '@theme':       './src/theme',
          '@types':       './src/types',
          '@utils':       './src/utils',
        },
      },
    ],
    // Reanimated plugin (MUST be last)
    'react-native-reanimated/plugin',
  ],
};