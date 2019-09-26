const gulp = require('gulp')
const shell = require('gulp-shell')
const glob = require('glob')
const fs = require('fs-extra')
const del = require('del')
const seq = require('gulp-sequence').use(gulp)

// 删除文件
gulp.task('clean', callback => {
    del.sync([
        './dist/images',
        './dist/scripts',
        './dist/*.html',
        './dist/*.json',
    ], {
        force: true
    })
    callback()
})

// webpack打包
gulp.task('build:pack', shell.task([
    'cross-env NODE_ENV=production webpack --config build/webpack.client.config.js --progress --display-error-details --display-max-modules 0 --colors'
]))

// 生成html文件
gulp.task('build:html', callback => {
    const contents = fs.readFileSync('./dist/index.html')
    const search = './src/pages/*.jsx'
    const files = glob.sync(search)
    files.map(val => {
        let name = val.match(/\/([^\/]*)\.jsx$/)[1].toLowerCase()
        if (['app','index'].indexOf(name) === -1) {
            fs.writeFileSync(`./dist/${name}.html`, contents)
        }
    })
    callback()
})

// 清理并编译打包
gulp.task('build', seq('clean', 'build:pack', 'build:html'))
gulp.task('default', () => {})