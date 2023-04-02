const gulp = require('gulp');
const ts = require('gulp-typescript');
const terser = require('gulp-terser');
const rename = require('gulp-rename');
const clean = require('gulp-clean');

// 清理输出目录
function cleanTask() {
    return gulp.src(['types', 'lib', 'es'], {read: false, allowEmpty: true})
        .pipe(clean());
}

// 编译 TypeScript
function compileTypeScript() {
    const tsProject = ts.createProject('tsconfig.json', {declaration: true});
    return tsProject.src()
        .pipe(tsProject())
        .pipe(gulp.dest(file => {
            // 将 .d.ts 文件输出到 types 目录
            if (['.d.ts','.ts'].includes(file.extname)) {
                return 'es';
            }
            // 将 .js 文件输出到 lib 目录
            return 'lib';
        }));
}

// 压缩 JavaScript
function minifyJavaScript() {
    return gulp.src('lib/*.js')
        .pipe(terser())
        .pipe(rename({extname: '.min.js'}))
        .pipe(gulp.dest('lib'));
}

// 生成 .mjs 模块文件
function createMjsModule() {
    return gulp.src('lib/*.js')
        .pipe(rename({extname: '.mjs'}))
        .pipe(gulp.dest('es'));
}

exports.default = gulp.series(
    cleanTask,
    compileTypeScript,
    minifyJavaScript,
    createMjsModule);
