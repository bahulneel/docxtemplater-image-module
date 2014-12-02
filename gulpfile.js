var gulp = require('gulp');
var gutil = require('gulp-util');
var watch= require('gulp-watch');
var rename= require('gulp-rename');
var coffee= require('gulp-coffee');
var concat= require('gulp-concat');
var uglify= require('gulp-uglify');
var spawn = require('child_process').spawn;
// var livereload = require('gulp-livereload');
// var browserify = require('gulp-browserify');
var server=null;

var config={uglify:false}

var paths = {
	coffee: ['coffee/docxQrCode.coffee','coffee/xmlUtil.coffee','coffee/docUtils.coffee','coffee/imgManager.coffee','coffee/imgReplacer.coffee','coffee/index.coffee'],
	coffeeTest: ['coffee/test.coffee'],
	testDirectory:__dirname+'/test',
    js:'js/'
};

// gulp.task('browserify', function() {
//     browserified=gulp.src(__dirname+'/test.test.js')
//         .pipe(browserify({}))

//     browserified
//         .pipe(gulp.dest(__dirname+'/browser/'))

//     // Single entry point to browserify
//     browserified=gulp.src(__dirname+'/examples/main.js')
//         .pipe(browserify({}))

//     browserified
//         .pipe(uglify())
//         .pipe(rename('main.min.js'))
//         .pipe(gulp.dest(__dirname+'/browser'))

//     browserified
//         .pipe(gulp.dest(__dirname+'/browser/'))
// });

gulp.task('allCoffee', function () {
	gulp.src(paths.coffee)
        .pipe(coffee({bare:true}))
        .pipe(gulp.dest(paths.js))

	a=gulp.src(paths.coffeeTest)
		.pipe(coffee({map:true}))

	if(config.uglify)
		a=a.pipe(uglify())

	a=a
		.pipe(gulp.dest(paths.testDirectory));
});

gulp.task('watch', function () {
	gulp.src(paths.coffee)
		.pipe(watch(function(files) {
			var f=files.pipe(coffee({bare:true}))
				.pipe(gulp.dest(paths.js))
			// gulp.run('browserify');
			// gulp.run('jasmine');
			// gulp.run('livereload');
			return f;
		}));

	gulp.watch(paths.coffeeTest,['coffeeTest']);
});

gulp.task('coffeeTest', function() {
	a=gulp.src(paths.coffeeTest)
		.pipe(coffee({map:true}))

	if(config.uglify)
		a=a.pipe(uglify())

	a=a
		.pipe(gulp.dest(paths.testDirectory));

	// gulp.run('livereload');
	// gulp.run('jasmine');
	return a;
});

gulp.task('default',['coffeeTest','watch']);
