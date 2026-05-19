'use strict';

const commonConfig = require('./src/common/configureWebpack');

// Merge chainWebpack from commonConfig with local override
function mergeChainWebpack(baseChain, extraChain) {
  return function (config) {
    if (baseChain) baseChain.call(this, config);
    if (extraChain) extraChain.call(this, config);
  };
}

module.exports = {
  ...commonConfig,
  chainWebpack: mergeChainWebpack(commonConfig.chainWebpack, function (config) {
    // @codemirror v6 uses `export { type X }` syntax (TS 4.5+) which the
    // project's TypeScript 4.2.4 rejects. Restrict fork-ts-checker to only
    // report errors from src/ so it never type-checks node_modules/.d.ts files.
    if (config.plugins.has('fork-ts-checker')) {
      config.plugin('fork-ts-checker').tap(args => {
        const opts = args[0] || {};
        opts.reportFiles = ['src/**/*.{ts,tsx,vue}', '!**/__tests__/**'];
        return [opts];
      });
    }
  }),
  devServer: {
    proxy: {
      '/api/login': {
        target: 'http://192.168.21.198:8808',
        logLevel: 'debug',
        // pathRewrite: { '^/api/login': '/api/login' },
        changeOrigin: true,
        secure: false,
        onProxyRes(proxyRes) {
          proxyRes.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
        },
      },
      '/api/v1': {
        target: 'http://192.168.21.198:8808',
        logLevel: 'debug',
        // pathRewrite: { '^/api/v1': '/api/v1' },
        changeOrigin: true,
        secure: false,
        onProxyRes(proxyRes) {
          proxyRes.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
        },
      },
    },
  },
};
