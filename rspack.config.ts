import { defineConfig } from '@rspack/cli';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  type RspackPluginFunction,
  rspack,
  type SwcLoaderOptions,
} from '@rspack/core';
import { VueLoaderPlugin } from 'rspack-vue-loader';
import {
  ElementPlusResolver,
} from 'unplugin-vue-components/resolvers'
import Components from 'unplugin-vue-components/rspack';
// import V from 'unplugin-vue-routers/rspack';
// Target vbn5browsers, see: https://github.com/browserslist/browserslist
const targets = ['last 2 versions', '> 0.2%', 'not dead', 'Firefox ESR'];

// 定义环境变量 - 直接设置默认值
const defineEnv = {
  'import.meta.env.VITE_APP_BASE_API': JSON.stringify('/api'),
}

export default defineConfig({
   mode: (process.env.NODE_ENV as 'development' | 'production' | 'none') ?? 'development',
  entry: {
    main: './src/main.ts',
  },
  devServer: {
    port: 5173,
    historyApiFallback: true,
    hot: true,
    proxy: [
      {
        context: ['/api'],
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    ],
  },
  resolve: {
    extensions: ['...', '.ts', '.vue'],
    alias: {
    '@': path.resolve(fileURLToPath(new URL('.', import.meta.url)), 'src'),
  },
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'rspack-vue-loader',
        options: {
          experimentalInlineMatchResource: true,
        },
      },
      {
        test: /\.(js|ts)$/,
        use: [
          {
            loader: 'builtin:swc-loader',
            options: {
              jsc: {
                parser: {
                  syntax: 'typescript',
                },
              },
              env: { targets },
            } satisfies SwcLoaderOptions,
          },
        ],
      },
      {
        test: /\.css$/,
        type: 'css/auto',
      },
      {
        test: /\.svg/,
        type: 'asset/resource',
      },
    ],
  },
  plugins: [
    // 自动导入
    // Auto({
    //   imports: [
    //     'vue',
    //     'vue-router',
    //     'pinia',
    //   ],
    //   dts: 'src/auto-imports.d.ts',
    //   vueTemplate: true,
    // }) as RspackPluginFunction,
    new rspack.HtmlRspackPlugin({
      template: './index.html',
    }),
    new rspack.DefinePlugin({
      __VUE_OPTIONS_API__: true,
      __VUE_PROD_DEVTOOLS__: false,
      __APP_VERSION__: JSON.stringify('0.1.0'),
      ...defineEnv,
    }),
    Components({
      resolvers: [ElementPlusResolver()],

    }) as RspackPluginFunction,
    new VueLoaderPlugin() as RspackPluginFunction,
  ],
  output: {
    filename: '[name].[contenthash:8].js',
    chunkFilename: '[name].[contenthash:8].js',
    assetModuleFilename: 'assets/[name].[hash:8][ext]',
    clean: true,
  },
  optimization: {
    minimize: process.env.NODE_ENV === 'production',
    minimizer: [
      new rspack.SwcJsMinimizerRspackPlugin(),
      new rspack.LightningCssMinimizerRspackPlugin({
        minimizerOptions: { targets },
      }),
    ],
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: 10,
          reuseExistingChunk: true,
        },
      },
    },
  },
  experiments: {
    css: true,
  },
});
