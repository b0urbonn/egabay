// Learn more: https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push('wasm');
// Allow the generated MapLibre map page to be bundled as a native asset for WebView.
config.resolver.assetExts.push('html');

module.exports = config;
