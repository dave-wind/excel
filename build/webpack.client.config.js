const webpack = require('webpack')
const merge = require('webpack-merge')
const base = require('./webpack.base.config')
const HTMLPlugin = require('html-webpack-plugin')
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin
// const AssetsPlugin = require('assets-webpack-plugin')

const config = merge(base, {
    plugins: [
        /**
         * 配置环境变量
         */
        new webpack.DefinePlugin({
            'process.env': {
                'NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
            }
        }),
        /**
         * 使用[chunkhash]时更改了业务逻辑代码
         * 为了不对vendor.chunk.js产生影响
         * 这里需要使用HashedModuleIdsPlugin和manifest
         * 参考: http://geek.csdn.net/news/detail/135599
         */
        new webpack.HashedModuleIdsPlugin(),
        /**
         * 提取公共模块
         */
        new webpack.optimize.CommonsChunkPlugin({
            name: 'vendor',
            minChunks: 2
        }),
        /**
         * manifest.js(被抽离出来的Webpack的运行时代码)
         */
        new webpack.optimize.CommonsChunkPlugin({
            name: 'manifest',
            chunks: ['vendor']
        }),
        /**
         * 生成html文件
         */
        new HTMLPlugin({
            template: './src/template.html',
            filename: '../index.html',
            minify: {
              collapseWhitespace: true
            }
        }),
        /**
         * 生成记录版本号的mapping文件
         */
        // new AssetsPlugin({
        //     filename: './dist/webpack.assets.json',
        //     processOutput: function(assets) {
        //         return JSON.stringify(assets)
        //     }
        // })
    ]
})

if (process.env.NODE_ENV === 'production') {
    config.plugins.push(
        /**
         * 压缩JS
         * 去掉debugger
         * 去掉console
         */
        new webpack.optimize.UglifyJsPlugin({
            compress: {
                warnings: false,
                // drop_debugger: true,
                // drop_console: true,
            }
        }),
        /**
         * @description 去除 antDesign moment local 语言包 打包优化
         */
        new webpack.ContextReplacementPlugin(/moment[\/\\]locale$/, /zh-cn|en-us/),

        new BundleAnalyzerPlugin({
          analyzerMode: 'server',
          analyzerHost: '127.0.0.1',
          analyzerPort: '8888',
          reportFilename: '../report.html',
          statsOptions: {source: false}
        })
    )
}

module.exports = config;
