# gulp-tinypng-unlimited
Use tinypng to compress the gulp plugins of png and jpg.

## Install
```shell
$ npm install --save-dev gulp-tinypng-unlimited
```

## Usage
```javascript
const gulp = require('gulp');
const tinypng = require('gulp-tinypng-unlimited');

gulp.task('default', () => {
  return gulp.src('./img/**/*.@(png|jpg|jpeg)')
    .pipe(tinypng())
    .pipe(gulp.dest('./dist'));
});
```

## API
```javascript
const gulp = require('gulp');
const tinypng = require('gulp-tinypng-unlimited');

gulp.task('default', () => {
  return gulp.src('./img/**/*.@(png|jpg|jpeg)')
    .pipe(tinypng({
      cache: true,                    // 开启缓存
      cachePath: path.join(os.tmpdir(), package.name + '-cache'), // 缓存存放的目录
      filterRule: /\.(png|jpg|jpeg)$/i,   // 压缩的过滤规则
      outputErrorFilePath: true,      // 是否输出错误文件的路径
      outputErrorFiles: false,        // 是否依然将错误文件输出
    }))
    .pipe(gulp.dest('./dist'));
});
```

## Changelog
2018-4-25 16:25:04
1. 完成1.0.0版本的功能
2. 添加简单的测试
3. 提交npm