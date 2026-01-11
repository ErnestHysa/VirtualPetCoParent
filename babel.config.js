module.exports = function(api) {
  api.cache(true);
  const isTest = process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID;

  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      !isTest && 'nativewind/babel',
    ].filter(Boolean),
    plugins: [
      !isTest && 'react-native-reanimated/plugin',
    ].filter(Boolean),
  };
};
