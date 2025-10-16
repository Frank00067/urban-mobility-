import gulp from "gulp";
import ts from "gulp-typescript";
import { deleteSync as del } from "del";

var tsProject = ts.createProject("tsconfig.json");

// Task which would transpile typescript to javascript
gulp.task("typescript", function () {
  tsProject.config["exclude"] = ["./src/public/ts/**/*"];
  return tsProject.src().pipe(tsProject()).js.pipe(gulp.dest("dist"));
});

// Task which would delete the old dist directory if present
gulp.task("build-clean", function (done) {
  del(["./dist"]);
  done();
});

// Task which would just create a copy of the current views directory in dist directory
gulp.task("views", function () {
  return gulp.src("./src/views/**/*.ejs").pipe(gulp.dest("./dist/views"));
});

// Task which would just create a copy of the current static assets directory in dist directory
gulp.task("assets", function () {
  return gulp
    .src("./src/public/assets/**/*", { allowEmpty: true })
    .pipe(gulp.dest("./dist/public/assets"));
});

// The default task which runs at start of the gulpfile.js
gulp.task(
  "default",
  gulp.series("build-clean", "typescript", "views", "assets"),
);
