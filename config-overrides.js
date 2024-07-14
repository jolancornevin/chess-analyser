const path = require("path");

module.exports = {
  // The Webpack config to use when compiling your react app for development or production.
  webpack: function (config, env) {
    const wasmExtensionRegExp = /\.wasm$/;

    config.resolve.extensions.push(".wasm");

    config.module.rules.forEach(rule => {
      (rule.oneOf || []).forEach(oneOf => {
        if (oneOf.loader && oneOf.loader.indexOf("file-loader") >= 0) {
          // make file-loader ignore WASM files
          oneOf.exclude.push(wasmExtensionRegExp);
        }
      });
    });

    // add a dedicated loader for WASM
    config.module.rules.push({
      test: wasmExtensionRegExp,
      include: path.resolve(__dirname, "src"),
      use: [{ loader: require.resolve("wasm-loader"), options: {} }]
    });

    return config;
  },
  devServer: function(configFunction) {
    // Return the replacement function for create-react-app to use to generate the Webpack
    // Development Server config. "configFunction" is the function that would normally have
    // been used to generate the Webpack Development server config - you can use it to create
    // a starting configuration to then modify instead of having to create a config from scratch.
    return function(proxy, allowedHost) {
      // Create the default config by calling configFunction with the proxy/allowedHost parameters
      const config = configFunction(proxy, allowedHost);

      config.headers = {
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Embedder-Policy': 'require-corp',
      }

      // Return your customised Webpack Development Server config.
      return config;
    };
  },
}