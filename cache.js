const fs = require('fs-extra');
const path = require('path');
const md5Hex = require('md5-hex');
const packageConfig = require('./package.json');
const os = require('os');

class Cache {
    constructor(options){
        this.options = {
            directory: path.join(os.tmpdir(), packageConfig.name + '-cache'),     // 缓存存放的目录            
        };
        this.setOptions(options);
    }
    setOptions(options){
        this.options = Object.assign({}, this.options, options || {});
        // 创建缓存存放目录
        fs.ensureDirSync(this.options.directory);
    }
    has(file){
        const filename = md5Hex(file.contents);
        return fs.readdirSync(this.options.directory).indexOf(filename) !== -1;
    }
    get(file){
        const filename = md5Hex(file.contents);
        const filepath = path.join(this.options.directory, filename);
        const compressed = fs.readFileSync(filepath, {encoding: null});
        if (compressed) {
            file.contents = compressed;
        }
        return file;
    }
    set(file, compressed){
        // 缓存写入硬盘
        const filename = md5Hex(file.contents);
        const filepath = path.join(this.options.directory, filename);
        fs.outputFileSync(filepath, compressed.contents, {encoding: null});        
    }
}

module.exports = new Cache();