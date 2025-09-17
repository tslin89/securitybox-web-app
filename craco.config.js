const path = require('path');

module.exports = {
  webpack: {
    configure: (webpackConfig, { env, paths }) => {
      console.log('CRACO: Configuring webpack for environment:', env);
      
      // Disable ForkTsCheckerWebpackPlugin to prevent memory issues
      const originalPluginCount = webpackConfig.plugins.length;
      webpackConfig.plugins = webpackConfig.plugins.filter(plugin => {
        const isForkTsChecker = plugin.constructor.name === 'ForkTsCheckerWebpackPlugin';
        if (isForkTsChecker) {
          console.log('CRACO: Removing ForkTsCheckerWebpackPlugin to prevent memory issues');
        }
        return !isForkTsChecker;
      });
      
      console.log(`CRACO: Removed ${originalPluginCount - webpackConfig.plugins.length} ForkTsCheckerWebpackPlugin(s)`);

      // Only apply optimizations for production builds
      if (env === 'production') {
        // Optimize for memory usage in production
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
              charts: {
                test: /[\\/]node_modules[\\/]@mui[\\/]x-charts[\\/]/,
                name: 'charts',
                chunks: 'all',
                priority: 30,
              },
            },
          },
          usedExports: true,
          sideEffects: false,
        };

        // Reduce memory usage during build
        webpackConfig.performance = {
          hints: false,
          maxEntrypointSize: 512000,
          maxAssetSize: 512000,
        };

        // Minimize for production
        webpackConfig.optimization.minimize = true;
        webpackConfig.optimization.minimizer = webpackConfig.optimization.minimizer || [];
      }

      // Optimize module resolution
      webpackConfig.resolve = {
        ...webpackConfig.resolve,
        modules: [path.resolve(__dirname, 'src'), 'node_modules'],
        extensions: ['.ts', '.tsx', '.js', '.jsx'],
        alias: {
          '@': path.resolve(__dirname, 'src'),
        },
      };


      return webpackConfig;
    },
  },
  // babel: {
  //   plugins: [
  //     // Tree shaking for better bundle optimization
  //     ['import', {
  //       libraryName: '@mui/material',
  //       libraryDirectory: '',
  //       camel2DashComponentName: false,
  //     }, 'core'],
  //     ['import', {
  //       libraryName: '@mui/icons-material',
  //       libraryDirectory: '',
  //       camel2DashComponentName: false,
  //     }, 'icons'],
  //   ],
  // },
};
