'use strict'

const express = require('express');
const app = express();
const path = require('path');
const router = express.Router();
const webpack = require('webpack');
const webpackDevMiddleware = require('webpack-dev-middleware');
const webpackHotMiddleware = require('webpack-hot-middleware');
const NODE_ENV = process.env.NODE_ENV || 'production';
const fs = require('fs');
const bodyParser = require('body-parser');
app.use(bodyParser.json());
const { basePath, port } = require('./config.js');
app.set('port', port);

const webpackConfig = require('./build/webpack.client.config.js');
const entryLength = Object.keys(webpackConfig.entry).length;

// webpack entry与testing entry合并
const testingPath = './build/testing.config.js';
if(fs.existsSync(path.join(__dirname, testingPath))){
    const testingEntry = require(testingPath).entry;
    Object.assign(webpackConfig.entry, testingEntry);
}
// 深拷贝entry
const entryCopy = JSON.parse(JSON.stringify(webpackConfig.entry));

// 映射根目录
app.use('/', express.static(path.join(__dirname, './')));
// 映射子目录
const envPath = path.join(__dirname, NODE_ENV === 'development' ? './src' : './dist');
if(fs.existsSync(envPath)){
    fs.readdirSync(envPath).forEach(file => {
        const pathname = path.join(envPath, file);
        const stat = fs.lstatSync(pathname)
        if(stat.isDirectory()){
            app.use(`/${file}`, express.static(pathname))
        }
    })
}

app.engine('.html', require('ejs').__express);
app.set('view engine', 'html');
app.set('views', path.join(__dirname, './views'));

if(NODE_ENV === 'development') {
    webpackConfig.entry.app = ['webpack-hot-middleware/client', webpackConfig.entry.app];
    webpackConfig.output.filename = '[name].js'
    webpackConfig.plugins.splice(1)//删除配置项
    webpackConfig.plugins.push(
        new webpack.HotModuleReplacementPlugin(),
        new webpack.NoEmitOnErrorsPlugin()
    );
    const compiler = webpack(webpackConfig)
    const devMiddleware = webpackDevMiddleware(compiler, {
        publicPath: webpackConfig.output.publicPath,
        stats: {
            colors: true,
            chunks: false
        }
    })
    app.use(devMiddleware);
    app.use(webpackHotMiddleware(compiler));
}

// 页面路由
router.get(`${basePath}/:controller`, (req, res) => {
    if (NODE_ENV === 'development') {
        let view = 'index'
        const controller = req.params.controller.replace('.html', '')
        // 根据entry路径判断是否是单元测试
        // 如果是单元测试加载专门的view
        if(entryCopy[controller]){
            if(entryCopy[controller].indexOf('__tests__/unit') !== -1)
                view = 'test'
        }
        res.render(view, {
            env: NODE_ENV,
            controller: controller
        })
    } else {
        const html = fs.readFileSync('./dist/index.html', 'utf-8')
        res.send(html)
    }
});

// gateway mock路由
router.all('', (req, res) => {
});

app.use(router);

const server = app.listen(app.get('port'), () => {
    const host = server.address().address;
    const port = server.address().port;
    console.log("express server listening on %s %s", host, port)
})