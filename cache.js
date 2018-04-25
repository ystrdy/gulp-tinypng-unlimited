const fs = require('fs-extra');
const path = require('path');
const md5Hex = require('md5-hex');
const uniqueString = require('unique-string');

class Cache {
    constructor(options){
        this.options = Object.assign({
            filename: 'cache',
        }, options);
        this.cache = {};

        this.init();
    }
    init(){
        const options = this.options;
        // 创建缓存存放目录
        fs.ensureDirSync(options.directory);
        // 读取缓存
        try{
            const filepath = path.join(options.directory, options.filename);
            this.cache = fs.readJsonSync(filepath);
        } catch(e){
            this.cache = {};
        }
    }
    has(file){
        return !!this.cache[md5Hex(file.contents)];
    }
    get(file){
        if (this.has(file)) {
            const filepath = this.cache[md5Hex(file.contents)];
            const copy = file.clone();
            file.contents = fs.readFileSync(filepath, {encoding: null});
            return copy;
        }
        return null;
    }
    set(file, copy){
        const options = this.options;
        // 缓存写入硬盘
        const filepath = path.join(options.directory, uniqueString());
        fs.outputFileSync(filepath, copy.contents, {encoding: null});
        // 缓存
        this.cache[md5Hex(file.contents)] = filepath;
        // 缓存列表写入硬盘
        const outputpath = path.join(options.directory, options.filename);
        fs.outputJSONSync(outputpath, this.cache);
    }
}

module.exports = Cache;