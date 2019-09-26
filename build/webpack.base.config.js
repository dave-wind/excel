const path = require('path')
const config = require('../config.js')

function resolve(dir) {
  return path.join(__dirname, '..', dir)
}

module.exports = {
  entry: {
    app: './src/entry-client.jsx',
    /**
     * 指定依赖包打包到vendor.js
     */
    vendor: [
      'core-js/fn/promise',
      'core-js/fn/object',
      'core-js/fn/array',
      'core-js/fn/set',
      'core-js/fn/map',
      'react',
      'react-dom',
      'react-router-dom',
    ]
  },
  output: {
    path: path.join(__dirname, '../dist/scripts'),
    publicPath: process.env.NODE_ENV === 'development'
        ? '/dev/'
        : config.publicPath,
    filename: `[name].[chunkhash:5].bundle.js`,
    chunkFilename: `[name].[chunkhash:5].chunk.js`
  },
  externals: {
    xlsx: "XLSX"
  },
  resolve: {
    extensions: ['.js', '.jsx'],
    alias: {
      '@': resolve('src')
    }
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        loader: 'babel-loader',
        exclude: /node_modules/
      },
      // {
      //   test: /\.(css|sass|scss)$/,
      //   use: ExtractTextPlugin.extract({
      //     fallback: 'style-loader',
      //     //如果需要，可以在 sass-loader 之前将 resolve-url-loader 链接进来
      //     use: [
      //       {
      //         loader: 'css-loader',
      //         options: {
      //           minimize: true
      //         }
      //       },
      //       {
      //         loader: 'sass-loader'
      //       }
      //     ]
      //   })
      // },
      {
        test: /\.(css|sass|scss)$/,
        use: [
          {
            loader: 'style-loader',
          },
          {
            loader: 'css-loader',
            options: {
              minimize: true
            }
          },
          {
            loader: 'sass-loader'
          }
        ]
      },
      {
        test: /\.(png|jpe?g|gif|svg)$/,
        loader: 'file-loader',
        options: {
          /**
           * 图片打包路径
           */
          outputPath: '../images/',
          name: '[name].[ext]'
        }
      },
    ],
  },
  plugins: [
    // new ExtractTextPlugin({
    //   filename:  (getPath) => {
    //     return getPath(`css/[name].[contenthash:5].css`).replace('css/js', 'css');
    //   },
    //   allChunks: true
    // })
  ]
}
