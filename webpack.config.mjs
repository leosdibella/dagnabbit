import * as path from 'path';
import { fileURLToPath } from 'url';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import TsconfigPathsPluginPkg from 'tsconfig-paths-webpack-plugin';
import * as ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';
import webpack from 'webpack';

const { TsconfigPathsPlugin } = TsconfigPathsPluginPkg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nodeConfig = {
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
    libraryExport: 'default'
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
      configFile: 'tsconfig.lib.json'
    })
  ],
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: 'ts-loader',
        options: {}
      }
    ]
  }
};
   
const browserConfig = {
  watchOptions: {
    ignored: /node_modules/
  },
  entry: './lib/browser/index.ts',
  target: 'web',
  output: {
    path: path.resolve(__dirname, './dist'),
    filename: 'browser.js',
    libraryTarget: 'umd',
    globalObject: 'this'
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
      configFile: 'tsconfig.lib.json'
    })
  ],
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: 'ts-loader',
        options: {}
      }
    ]
  }
};

const appConfig = {
  watchOptions: {
    ignored: /node_modules/
  },
  entry: './app/index.ts',
  target: 'web',
  output: {
    path: path.resolve(__dirname, './app-dist'),
    filename: 'browser.js',
    libraryTarget: 'umd',
    globalObject: 'this'
  },
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {},
    plugins: [
      new TsconfigPathsPlugin()
    ]
  },
  plugins: [
    new ForkTsCheckerWebpackPlugin(),
    new HtmlWebpackPlugin({
      template: './app/index.html'
    })
  ],
  devServer: {
    hot: true,
    port: appPort,
    server:  {
      type: 'http'
    },
    static: {
      directory: path.resolve(__dirname, './app-dist')
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
};

const generalConfig = {
  watchOptions: {
    ignored: /node_modules/
  },
  experiments: {
    asyncWebAssembly: true
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: 'ts-loader',
        options: {
          transpileOnly: !!env.noTypeCheck,
          onlyCompileBundledFiles: true
        }
      }
    ]
  },
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {},
    plugins: [
      new ForkTsCheckerWebpackPlugin(),
      new TsconfigPathsPlugin()
    ]
  }
}



export default (env = {}) => {
  return [
    nodeConfig,
    browserConfig,
    appConfig
  ];

  const server = {
    type: 'http'
  }

  return {
    node: {
      __dirname: true
    },
    watch: env.isProduction ? false : !!env.shouldWatch,
    watchOptions: {
      ignored: /node_modules/
    },
    mode: env.isProduction ? 'production' : 'development',
    devtool: 'source-map',
    entry: path.resolve(__dirname, './src/index.ts'),
    output: {
      filename: env.isProduction ? '[name].[contenthash].js' : '[hash].js',
      path: path.resolve(__dirname, 'dist'),
      publicPath: '/',
      clean: true
    },
    experiments: {
      asyncWebAssembly: true
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          loader: 'ts-loader',
          options: {
            transpileOnly: !!env.noTypeCheck,
            onlyCompileBundledFiles: true
          }
        }
      ]
    },
    resolve: {
      extensions: ['.ts', '.js', '.json'],
      alias: {},
      plugins: [
        new TsconfigPathsPlugin()
      ]
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './src/index.html'
      }),
      new webpack.DefinePlugin({
        ACICULATE_API_ORIGIN: JSON.stringify(apiOrigin)
      })
    ],
    devServer: {
      hot: true,
      port: appPort,
      server,
      static: {
        directory: path.resolve(__dirname, './dist')
      },
      devMiddleware: {
        index: true,
        mimeTypes: {
          phtml: 'text/html'
        },
        publicPath: './dist',
        writeToDisk: true
      }
    }
  }
};
