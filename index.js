const through = require('through2');
const PluginError = require('plugin-error');
const log = require('fancy-log');
const request = require('request');
const download = require('download');
const packageConfig = require('./package.json');
const chalk = require('chalk');
const path = require('path');

let cache;

module.exports = function (opt) {
    const options = Object.assign({
        cache: true,                        // 开启缓存
        // cachePath: path.join(os.tmpdir(), packageConfig.name + '-cache'),                    // 缓存存放的目录
        outputErrorLog: true,               // 打印错误日志
        outputErrorFiles: false,            // 仍然将错误文件输出
    }, opt || {});
    // 启用缓存
    if (options.cache) {
        cache = require('./cache');
        // 自定义缓存
        options.cachePath && cache.setOptions({ directory: options.cachePath });
    }
    // 输出错误信息
    const logError = function (msg) {
        options.outputErrorLog && log.error(chalk.red(msg));
    };
    // 读取广告缓存
    return through.obj(function (file, encode, callback){
        if (file.isNull()) {
            return callback(null, file);
        }
        if (file.isStream()) {
            return callback(new PluginError({
                plugin: packageConfig.name,
                message: 'Streaming not supported',
            }));
        }
        if (file.isBuffer()) {
            if (/\.(png|jpg|jpeg)$/i.test(file.path)) {   // 只压缩png和jpg文件
                // 提取文件
                extract(file, function (error, result) {
                    if (error) {
                        logError(error);
                        callback(null, options.outputErrorFiles ? file : undefined);
                    } else {
                        callback(null, result);
                    }
                });
            } else {
                logError(file.path + '不是png或jpg图片.');
                callback(null, file);
            }
        }
    });
};

/**
 * 提取文件，如果缓存中存在，那么从缓存里面提取，否则去服务器压缩
 * @param {VinylFile} file 等待压缩的文件
 * @param {Function} callback 回调
 */
function extract(file, callback) {
    // 先从缓存中取
    if (cache && cache.has(file)) {
        const result = cache.get(file);
        return callback(null, result);
    }
    // 压缩文件
    compress(file, function(error, result) {
        if (error) {
            callback(file.path + '压缩文件失败.');
        } else {
            // 存到缓存
            cache && cache.set(file, result);
            callback(null, result);
        }
    });
}

/**
 * 去tinypng压缩文件
 * @param {VinylFile} file 等待压缩的文件
 * @param {Function} callback 回调
 */
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
            return callback('未获取到压缩后的下载URL.');
        }
    });
}