const through = require('through2');
const PluginError = require('plugin-error');
const log = require('fancy-log');
const request = require('request');
const download = require('download');
const package = require('./package.json');
const path = require('path');
const chalk = require('chalk');
const os = require('os');
const Cache = require('./cache');

module.exports = function (opt) {
    const options = Object.assign({
        cache: true,                    // 开启缓存
        cachePath: path.join(os.tmpdir(), package.name + '-cache'), // 缓存存放的目录
        filterRule: /\.(png|jpg|jpeg)$/i,   // 压缩的过滤规则
        outputErrorFilePath: true,      // 是否输出错误文件的路径
        outputErrorFiles: false,        // 是否依然将错误文件输出
    }, opt || {});
    // 缓存
    let cache;
    if (options.cache) {
        cache = new Cache({
            directory: options.cachePath,
        });
    }
    // 读取广告缓存
    return through.obj(function (file, encode, callback){
        if (file.isNull()) {
            return callback(null, file);
        }
        if (file.isStream()) {
            return callback(new PluginError({
                plugin: package.name,
                message: 'Streaming not supported',
            }));
        }
        if (file.isBuffer()) {
            if (options.filterRule.test(file.path)) {   // 只压缩png和jpg文件
                // 先从缓存中取
                if (cache && cache.has(file)) {
                    const copy = cache.get(file);
                    return callback(null, copy);
                }
                // 压缩文件
                compress(file, function(error, copy) {
                    if (error) {
                        if (options.outputErrorFilePath) {
                            log.error(chalk.red(file.path + ' ' + error.message));
                        }
                        if (options.outputErrorFiles) {
                            callback(null, file);
                        } else {
                            callback(null);
                        }
                    } else {
                        // 存到缓存
                        cache && cache.set(file, copy);
                        callback(null, copy);
                    }
                });
            } else {
                callback(null, file);
            }
        }
    });
};

function compress(file, callback) {
    request({
        url: 'https://tinypng.com/web/shrink',
        method: "POST",
        headers: {
            "Accept" : "*/*",
            "Accept-Encoding" : "gzip, deflate",
            "Accept-Language" : "zh-CN,zh;q=0.9,en;q=0.8",
            "Cache-Control" : "no-cache",
            "Pragma" : "no-cache",
            "Connection"  : "keep-alive",
            "Host" : "tinypng.com",
            "Referer" : "https://tinypng.com/",
            "User-Agent" : "Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.140 Safari/537.36",
        },
        body: file.contents
    }, function(error, response, body) {
        if (error) {
            return callback(error);
        }
        let fileURL;
        try{
            fileURL = JSON.parse(body).output.url;
        } catch(e){
            return callback(e);
        }
        if (fileURL) {
            download(fileURL).then(function (data) {
                const clone = file.clone();
                clone.contents = data;
                callback(null, clone);
            }).catch(callback);
            return;
        } else {
            return callback(new TypeError('未获取到压缩后的下载URL.'));
        }
    });
}