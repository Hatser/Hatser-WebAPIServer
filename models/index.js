'use strict';

let fs          = require('fs');
let path        = require('path');
const Sequelize = require('sequelize');

let Op = Sequelize.Op;
let operatorsAliases={$eq:Op.eq,$ne:Op.ne,$gte:Op.gte,$gt:Op.gt,$lte:Op.lte,$lt:Op.lt,$not:Op.not,$in:Op.in,$notIn:Op.notIn,$is:Op.is,$like:Op.like,$notLike:Op.notLike,$iLike:Op.iLike,$notILike:Op.notILike,$regexp:Op.regexp,$notRegexp:Op.notRegexp,$iRegexp:Op.iRegexp,$notIRegexp:Op.notIRegexp,$between:Op.between,$notBetween:Op.notBetween,$overlap:Op.overlap,$contains:Op.contains,$contained:Op.contained,$adjacent:Op.adjacent,$strictLeft:Op.strictLeft,$strictRight:Op.strictRight,$noExtendRight:Op.noExtendRight,$noExtendLeft:Op.noExtendLeft,$and:Op.and,$or:Op.or,$any:Op.any,$all:Op.all,$values:Op.values,$col:Op.col};


//sequelize 변수로 데이터베이스에 접속
const sequelize = new Sequelize(
	global.config.db_default_database, // 데이터베이스 이름
	global.config.db_username, // 유저 명
	global.config.db_password, // 비밀번호
	{
		'host': global.config.db_hostname, // 데이터베이스 호스트
		'port': global.config.db_port,
		'dialect': 'mysql', // 사용할 데이터베이스 종류
		'pool': { 'max': 5, 'min': 0, 'idle': 10000 },
		freezeTableName: true,
		operatorsAliases: operatorsAliases,
		logging: console.log // console.log
	}
);

let db = {};

// Windows?
var win32 = process.platform === 'win32';

walk(__dirname, importModel);


// to check only if a property exists, without getting its value:
function checkNested(obj /*, level1, level2, ... levelN*/) {
	var args = Array.prototype.slice.call(arguments, 1);

	for (var i = 0; i < args.length; i++) {
		if (!obj || !obj.hasOwnProperty(args[i])) {
			return false;
		}
		obj = obj[args[i]];
	}
	return true;
}

Object.keys(db).forEach(function(modelName) {
	if(checkNested(db[modelName], 'options', 'classMethods', 'associate')){
		db[modelName].options.classMethods.associate(db);
	}
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

// 모듈로써 models 폴더가 작동할 수 있도록 함
module.exports = db;

// Normalize \\ paths to / paths.
function unixifyPath(filepath) {
	if (win32) {
		return filepath.replace(/\\/g, '/');
	} else {
		return filepath;
	}
}

//models 폴더의 파일을 모두 읽어서 db변수에 연결한다.
function walk(rootdir, callback, subdir) {
	var abspath = subdir ? path.join(rootdir, subdir) : rootdir;
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

function importModel(filepath, rootdir, subdir, filename) {
	var model = sequelize.import(path.join(rootdir, subdir, filename));
	if(model !== null)
		db[model.name] = model;
}