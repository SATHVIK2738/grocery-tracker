const webpack = require('webpack');

module.exports = function override(config) {
  // Add fallbacks for Node.js core modules
  config.resolve.fallback = {
    ...config.resolve.fallback,
    "fs": false,
    "path": false,
    "crypto": false
  };

  // Configure WebAssembly loading
  config.module.rules.push({
    test: /\.wasm$/,
    type: "webassembly/async"
  });

  // Enable WebAssembly
  config.experiments = {
    ...config.experiments,
    asyncWebAssembly: true
  };

  return config;
}; 