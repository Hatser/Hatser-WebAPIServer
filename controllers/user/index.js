let fs          = require('fs');
let path        = require('path');

walk(__dirname, assignController);

// Windows?
var win32 = process.platform === 'win32';
// Normalize \\ paths to / paths.
function unixifyPath(filepath) {
	if (win32) {
		return filepath.replace(/\\/g, '/');
	} else {
		return filepath;
	}
}

// 폴더의 파일을 모두 읽어서 합친다.
function walk(rootdir, callback, subdir) {
	var abspath = subdir ? path.join(rootdir, subdir) : rootdir;
	subdir = subdir || '';
	fs.readdirSync(abspath)
		.filter(function(file) {
			return (file.indexOf('.') !== 0) && (file !== 'index.js');
		})
		.forEach(function(filename) {
			var filepath = path.join(abspath, filename);
			if (fs.statSync(filepath).isDirectory()) {
				walk(rootdir, callback, unixifyPath(path.join(subdir || '', filename || '')));
			} else {
				callback(unixifyPath(filepath), rootdir, subdir, filename);
			}
		});
}

function assignController(filepath, rootdir, subdir, filename) {
	var controllerModule = require(path.join(rootdir, subdir, filename));
	if(controllerModule !== null)
		Object.assign(exports, controllerModule);
}