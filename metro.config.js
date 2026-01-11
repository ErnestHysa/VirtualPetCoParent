const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Add support for NatieWind v4 CSS
module.exports = withNativeWind(config, { input: './global.css' });
