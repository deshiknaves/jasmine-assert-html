const gulp = require('gulp');
const jasmineBrowser = require('gulp-jasmine-browser');

gulp.task('test', () => {
    return gulp.src(['./lib/jasmine-assert-html.js', './spec/**/*_spec.js'])
        .pipe(jasmineBrowser.specRunner({console: true}))
        .pipe(jasmineBrowser.headless());
});

gulp.task('default', ['test']);

gulp.task('watch', () => {
    gulp.watch("spec/**/*.js", ['test']);
});