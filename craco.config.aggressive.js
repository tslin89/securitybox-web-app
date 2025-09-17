const path = require('path');

module.exports = {
  webpack: {
    configure: (webpackConfig, { env, paths }) => {
      console.log('CRACO AGGRESSIVE: Configuring webpack for environment:', env);
      
      // Remove ALL TypeScript and ESLint related plugins
      const pluginsToRemove = [
        'ForkTsCheckerWebpackPlugin',
        'ESLintWebpackPlugin',
        'TypeScriptTypeChecker',
        'ForkTsCheckerWebpackPlugin'
      ];
      
      const originalPluginCount = webpackConfig.plugins.length;
      webpackConfig.plugins = webpackConfig.plugins.filter(plugin => {
        const pluginName = plugin.constructor.name;
        const shouldRemove = pluginsToRemove.includes(pluginName);
        if (shouldRemove) {
          console.log(`CRACO AGGRESSIVE: Removing ${pluginName} to prevent memory issues`);
        }
        return !shouldRemove;
      });
      
      console.log(`CRACO AGGRESSIVE: Removed ${originalPluginCount - webpackConfig.plugins.length} plugin(s)`);

      // Disable TypeScript checking entirely
      webpackConfig.resolve = {
        ...webpackConfig.resolve,
        extensions: ['.js', '.jsx', '.json'], // Remove .ts and .tsx
      };

      // Only apply optimizations for production builds
      if (env === 'production') {
        // Basic production optimizations without complex splitting
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
            },
          },
        };

        // Minimize for production
        webpackConfig.optimization.minimize = true;
        webpackConfig.optimization.minimizer = webpackConfig.optimization.minimizer || [];
      }

      return webpackConfig;
    },
  },
};
