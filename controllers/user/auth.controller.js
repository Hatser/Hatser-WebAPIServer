/*
 * 웹을 이용하는 사용자의 로그인, 로그아웃 시의 인증과 처리를 담당하는 컨트롤러
 * by. Trostal
 */

var passport    = require('passport'),
	jwt         = require('jsonwebtoken'),
	webAdminController = require('./web-admin.controller'),
	serverAdminController = require('./server-admin.controller');

exports.user_url_strip_path = function(req, res, next) {
	req.url = req.originalUrl;
	next();
};


exports.user_authenticate = passport.authenticate('steam', { failureRedirect: '/', session:false });

exports.user_authenticate_return = function(req, res, next) {
	passport.authenticate('steam', { failureRedirect: '/', session:false }, function(err, user, info){
		console.log('err: ' + err)
		console.log(user)
		console.log(info)
		if(!err && user) {
			user = user._json;
			console.log('로그인 토큰 발행 과정 실행');
			exports.user_generate_token(user, (err, token)=>{
				if(!err) {
					console.log('로그인 토큰 발행');
					res.cookie('token', token, { maxAge: global.config.login_token_age, httpOnly: true /* TODO: Set secure: true */ });
					//				res.cookie('user', token, { maxAge: global.config.login_token_age }); // 프론트엔드 측에서 script로 다룰 수 있는 토큰과, 다룰 수 없는 전송용 토큰, 두 개를 보낸다.
					// httpOnly 토큰은 서버에서 verify하는 용도로 사용한다.
					res.setHeader('Authorization', `Bearer ${token}`);
				} else console.log(err);
				res.redirect('/');
			});
		} else {
			console.log(err);
			res.redirect('/');
		}
	})(req, res, next);
};

exports.user_authenticated = function(req, res) {
	res.redirect('/');
};

exports.user_ensure_jwt_authenticated = function(req, res, next) {
	if(req.cookies.token){
		jwt.verify(req.cookies.token, global.config.jwt_token_secret_key, function(err, decode){
			if(err)	req.user = undefined;
			req.user = decode.user;
			next();
		});
	} else {
		req.user = undefined;
		next();
	}
};

exports.user_sign_out = function(req, res){
	/*req.session.destroy(function(err){ // 세션 삭제
	if(err){
		console.log(err);
	}else{
		req.logout();
		res.redirect('/');
	}
	});*/
	req.logout();
	req.session = null;
	res.redirect('/');
};

exports.user_generate_token = (user, callback) => {

	console.log('새 토큰 발행 과정 실행 1');
	webAdminController.user_get_web_permission_list(user.steamid, function(err, webPerms) {
		console.log('새 토큰 발행 과정 실행 2');
		if(!err) {
			console.log('새 토큰 발행 과정 실행 3');
			user.webPermissions = webPerms;
			serverAdminController.user_get_server_permission_list(user.steamid, function(err, serverPerms){
				console.log('새 토큰 발행 과정 실행 4');
				if(!err) {
					console.log('새 토큰 발행 과정 실행 5');
					if(serverPerms) {
						user.serverPermissions = serverPerms;
					}
		
					const token = jwt.sign({user}, global.config.jwt_token_secret_key, {
						algorithm: 'HS256',
						expiresIn: global.config.login_token_age
					});

					callback(null, token);
				} else {
					callback('an error occuired while getting game server permission list', null);
				}
	
				
			});
		} else {
			callback('an error occuired while getting game web permission list', null);
		}
	});
};

exports.user_has_valid_token = (token, callback) => {
	jwt.verify(token, global.config.jwt_token_secret_key, (err, decode) => {
		if (err) {
			// console.log("=========Token Helper: Can't decode token")
			callback(err, null, null);
		} else {
			const exp = new Date(decode.exp * 1000);
			const iat = new Date(decode.iat * 1000);
			const now = Date.now();
			if (exp < now) {
				// console.log("=========Token Helper: Expired Token")
				console.log('토큰 만료됨');
				callback('Expired Token', null, null);
			} else if (now - iat <= global.config.login_session_validation_period) { // 토큰이 발행된 지(issued at) 설정된 시간 이상 지났다면..
				// console.log("=========Token Helper: Generate New Token")
				console.log('새 토큰 발행');
				const newToken = exports.user_generate_token(decode.user); // 새 토큰 발행
				callback(null, newToken, decode);
			} else {
				// console.log("=========Token Helper: Token is valid")
				console.log('토큰 유효함');
				callback(null, token, decode);
			}
		}
	});
};
exports.user_check_token = (req, res, next) => {
	console.log('토큰 검증 시작');
	const token = req.cookies.token;
	if(token) {
		module.exports.user_has_valid_token(token, (err, token, decode) => {
			if(!err) {
				console.log('토큰 인증 완료');
				req.user = decode.user;
				res.cookie('token', token, { expires: new Date(decode.exp * 1000), httpOnly: true /* TODO: Set secure: true */ });
				// res.cookie('user', token, { expires: new Date(decode.exp * 1000) }); // 프론트엔드 측에서 script로 다룰 수 있는 토큰과, 다룰 수 없는 전송용 토큰, 두 개를 보낸다.
				// httpOnly 토큰은 서버에서 verify하는 용도로 사용한다.
				res.setHeader('Authorization', `Bearer ${token}`);
				res.json({success:true, message:'로그인 정보가 인증되었습니다.'});
			} else {
				console.log('토큰 쿠키 삭제');
				res.clearCookie('token');
				res.clearCookie('user');
				res.json({success:false, message:'로그인 정보가 만료되었습니다.'});
			}
		});
	} else {
		console.log('토큰 없음');
		res.json({success:false, message:'로그인 정보가 없습니다.'});
	}
};