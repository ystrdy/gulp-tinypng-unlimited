const gulp = require('gulp');
const tinypng = require('../');

gulp.task('default', () => {
    return gulp.src('./img/**/*.@(png|jpg|jpeg)')
        .pipe(tinypng())
        .pipe(gulp.dest('./dist'));
});