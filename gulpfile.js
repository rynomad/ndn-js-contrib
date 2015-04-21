var git_branch = "next"


var gulp = require('gulp');
var gutil = require('gulp-util');
var jshint = require('gulp-jshint');
var git = require('gulp-git');
var connect = require('gulp-connect');
var browserify = require('browserify');
var leveldown = require("leveldown")
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');
var jsdoc = require("gulp-jsdoc");

var mocha = require('gulp-mocha');




gulp.task('browserify-tests',['mocha'], function () {
  // set up the browserify instance on a task basis
  var b = browserify();
  b.add('./test/NameTree.js')
   .add('./test/ContentStore.js')
   .add('./test/PIT.js')
   .add('./test/FIB.js')
   .add('./test/Repository.js')
   .add('./test/Node.js');

  var stream = b.bundle()
    .pipe(source('tests.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init({loadMaps: true}))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('./test/browser/'));

  gulp.src('./test/browser/index.html')
    .pipe(connect.reload());

  return stream;
});

gulp.task('mocha', ['lint'],function() {
    return gulp.src(['test/*.js'], { read: false })
        .pipe(mocha({ reporter: 'list' }))
        .on('error', gutil.log);
});

gulp.task('lint', function() {
  return gulp.src('./src/**/*.js')
    .pipe(jshint({laxcomma:true}))
    .pipe(jshint.reporter('default'))
    //.pipe(jshint.reporter('fail'))
});


gulp.task('live',['browserify-tests'], function () {
  gulp.src('./test/index.html')
    .pipe(connect.reload());
});

gulp.task('jsdoc', function(){
  gulp.src("./src/DataStructures/ContentStore.js")
        .pipe(jsdoc.parser({plugins: ['plugins/commentsOnly.js']}))
        .pipe(jsdoc.generator('./doc'))

});


gulp.task('dev-auto-commit', ['browserify-tests','mocha','live', 'jsdoc'], function(){
  return gulp.src(['./src/DataStructures/*.js','./test/*.js'])
  .pipe(git.commit("auto commit: " + new Date()))

})


gulp.task('watch', function() {
    connect.server({
      root: 'test',
      livereload: true
    });
    gulp.watch(['src/**', "test/*.js"], ['dev-auto-commit'])
})
