/** 
 * This is a bespoke gulp file I've created to allow the creation of 'subapps'
 * within the prototyping kit. It's quick and not as nice as it could be
 * because I'm deliberately trying to make the upgrade path smooth.
 *
 * The 'subapp' task is what gets ran within the start.js file for 
 * this prototype.
 */

var gulp = require('gulp')
var sass = require('gulp-sass')
var sourcemaps = require('gulp-sourcemaps')
var runSequence = require('run-sequence').use(gulp);
var config = require('./config.json')

gulp.task('subapp-sass', function () {
	// any sass file found within views will get processed.
  return gulp.src('app/views/**/*.scss')
  .pipe(sass({outputStyle: 'expanded',
    includePaths: ['govuk_modules/govuk_frontend_toolkit/stylesheets/',
      'govuk_modules/govuk_template/assets/stylesheets/',
      'govuk_modules/govuk-elements-sass/',
      'app/assets/sass/'
    ]}).on('error', sass.logError))
  .pipe(sourcemaps.init())
  .pipe(sourcemaps.write())
	// this writes the file to the same location as the src file.
  .pipe(gulp.dest(function(file) {
    return file.base;
	}))
})

gulp.task('watch-subapp-sass', function(){
  return gulp.watch('app/views/apps/**/*.scss', {cwd: './'}, ['subapp-sass'])
})

gulp.task('subapp', function (done) {
  runSequence(
		'generate-assets',
	  'subapp-sass',
	  'watch',
		'watch-subapp-sass',
	  'server',
		done
	)
})