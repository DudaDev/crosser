var gulp = require('gulp'),
	webpack = require('webpack'),
	gutil = require('gulp-util'),
	webpackConfig = require('./webpack-config'),
	NODE_ENV = process.env.NODE_ENV === "production" ? "production" : "development";

gulp.task("webpack", function(callback) {
	// run webpack
	webpack(webpackConfig, function(err, stats) {
		if (err) throw new gutil.PluginError("webpack", err);
		gutil.log("[webpack]", stats.toString({
			// output options
		}));
		callback();
	});
});

gulp.task("watch", function(callback) {
	gulp.watch('client/**/*.js', ['webpack']);
});

gulp.task('default', ['webpack']);