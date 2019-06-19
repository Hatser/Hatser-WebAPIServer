let express = require('express');
let path = require('path');
let favicon = require('serve-favicon');
let logger = require('morgan');
let cookieParser = require('cookie-parser');
let bodyParser = require('body-parser');

let app = express();

/********************************************
************* 설정 및 전처리 과정 ************
*********************************************/

//TODO:5 steps to making a Node.js frontend app 10x faster
//https://engineering.gosquared.com/making-dashboard-faster
global.config = require('./config/config');
let models = require('./models'); // 모델을 사용하기 위해 불러옴

// view engine setup
app.set('views', path.join(global.config.view_path, global.config.view_template_path));
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'public')));

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// 유저 인증 기능(Passport)
// 이후에 user 라우터 -> user컨트롤러에서 passport를 사용하고,
// 이 패스포트를 사용하기 위해 전처리 과정을 거쳐야 하기에 이 모듈이 먼저 불러와져야
// 이후에 사용 가능하다. (그러지 않을 시 passport.initicate() not in use 에러 발생)
require('./app/user/auth')(app);

// 모델과 DB의 동기화
models.sequelize.sync();

// 언어설정
require('./app/locale')(app);
// 시간 헬퍼 로드
require('./app/time')(app);

/********************************************
******************* 라우팅  *****************
*********************************************/

app.use('/', require('./routes/index'));

// 에러 캐치 부분, 에러 캐치가 맨 마지막에 등장하지 않으면, 
// 뒤에 정의되는 라우트에 접근했을 때 Not Found 에러가 발생하게 된다.
// catch 404 and forward to error handler
app.use(function(req, res, next) {
	var err = new Error('Not Found');
	err.status = 404;
	next(err);
});

// error handler
app.use(function(err, req, res, next) {
	if(err.code === 'LIMIT_FILE_SIZE') {
		res.json({success:false, error:'파일 크기가 너무 큽니다.'});
	}
	// set locals, only providing error in development
	res.locals.message = err.message;
	res.locals.error = req.app.get('env') === 'development' ? err : {};

	// render the error page
	res.status(err.status || 500);
	res.render('error');
});
module.exports = app;
