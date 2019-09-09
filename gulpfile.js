var gulp = require("gulp");
var browserify = require("browserify");
var babelify = require("babelify");
var source = require("vinyl-source-stream");
var minify = require("gulp-minify");

gulp.task('build', () => {
  browserify({
    entries: './RsShopify.js',
    debug: true
  })
  .transform(babelify, {presets:['@babel/env']})
  .bundle()
  .pipe( source('./RsShopify.js') )
  .pipe( gulp.dest('./dist') );

  return gulp.src('./dist/RsShopify.js');
});

gulp.task('minify', () => {
  gulp.src('./dist/RsShopify.js')
  .pipe( minify() )
  .pipe(gulp.dest('./dist'));

  return gulp.src('./dist/RsShopify.js');
})