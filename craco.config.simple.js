const path = require('path');

module.exports = {
  webpack: {
    configure: (webpackConfig, { env, paths }) => {
      // Only disable ForkTsCheckerWebpackPlugin to prevent memory issues
      const ForkTsCheckerWebpackPlugin = webpackConfig.plugins.find(
        plugin => plugin.constructor.name === 'ForkTsCheckerWebpackPlugin'
      );
      
      if (ForkTsCheckerWebpackPlugin) {
        // Disable the plugin entirely to prevent memory issues
        webpackConfig.plugins = webpackConfig.plugins.filter(plugin => plugin.constructor.name !== 'ForkTsCheckerWebpackPlugin');
      }

      // Only apply production optimizations for production builds
      if (env === 'production') {
        // Basic production optimizations
        webpackConfig.optimization = {
          ...webpackConfig.optimization,
          splitChunks: {
            chunks: 'all',
            cacheGroups: {
              vendor: {
                test: /[\\/]node_modules[\\/]/,
                name: 'vendors',
                chunks: 'all',
                priority: 10,
              },
              mui: {
                test: /[\\/]node_modules[\\/]@mui[\\/]/,
                name: 'mui',
                chunks: 'all',
                priority: 20,
              },
            },
          },
        };
      }

      return webpackConfig;
    },
  },
};
