// Learn more: https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Allow the Leaflet map page to be bundled as a native asset for WebView.
config.resolver.assetExts.push('html');

module.exports = config;
