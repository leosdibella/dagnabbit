import * as path from 'path';
import { fileURLToPath } from 'url';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import TsconfigPathsPluginPkg from 'tsconfig-paths-webpack-plugin';
import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';
import nodeExternals from 'webpack-node-externals';

const { TsconfigPathsPlugin } = TsconfigPathsPluginPkg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nodeConfig = (env) => ({
  mode: env.isProduction ? 'production' : 'development',
  watchOptions: {
    ignored: /node_modules/
  },
  entry: './lib/node/index.ts',
  target: 'node',
  externals: [nodeExternals()],
  output: {
    path: path.resolve(__dirname, './dist'),
    filename: 'node.js',
    libraryTarget: 'umd',
    libraryExport: 'default',
    clean: true
  },
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {},
    plugins: [
      new TsconfigPathsPlugin()
    ]
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: 'ts-loader',
        options: {
          configFile: path.resolve(__dirname, './tsconfig.lib.json')
        }
      }
    ]
  }
});
   
const browserConfig = (env) => ({
  mode: env.isProduction ? 'production' : 'development',
  watchOptions: {
    ignored: /node_modules/
  },
  entry: './lib/browser/index.ts',
  target: 'web',
  output: {
    path: path.resolve(__dirname, './dist'),
    filename: 'browser.js',
    libraryTarget: 'umd',
    globalObject: 'this',
    libraryExport: 'default',
    umdNamedDefine: true,
    library: 'dagnabbit'
  },
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {},
    plugins: [
      new TsconfigPathsPlugin()
    ]
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: 'ts-loader',
        options: {
          configFile: path.resolve(__dirname, './tsconfig.lib.json')
        }
      }
    ]
  }
});

const appConfig = (env) => ({
  mode: env.isProduction ? 'production' : 'development',
  watchOptions: {
    ignored: /node_modules/
  },
  entry: './app/index.ts',
  target: 'web',
  devtool: 'source-map',
  output: {
    path: path.resolve(__dirname, './app-dist'),
    filename:'[name].[contenthash].js',
    clean: true
  },
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {},
    plugins: [
      new TsconfigPathsPlugin()
    ]
  },
  plugins: [
    new ForkTsCheckerWebpackPlugin({
      typescript: {
        configFile: path.resolve(__dirname, './tsconfig.app.json')
      }
    }),
    new HtmlWebpackPlugin({
      template: './app/index.html'
    })
  ],
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: 'ts-loader',
        options: {
          configFile: path.resolve(__dirname, './tsconfig.app.json')
        }
      }
    ]
  },
  devServer: {
    hot: true,
    port: 3000,
    server:  {
      type: 'http'
    },
    static: {
      directory: path.resolve(__dirname, './app-dist'),
    },
    devMiddleware: {
      index: true,
      mimeTypes: {
        phtml: 'text/html'
      },
      publicPath: './app-dist',
      writeToDisk: true
    }
  }
});

export default (env = {}) => {
  return [
    nodeConfig(env),
    browserConfig(env),
    appConfig(env)
  ];
};
