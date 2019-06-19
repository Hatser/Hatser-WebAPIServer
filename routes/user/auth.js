let express = require('express');
let router = express.Router();

let authController = require('../../controllers/user/auth.controller');
// GET /auth/steam
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  The first step in Steam authentication will involve redirecting
//   the user to steamcommunity.com.  After authenticating, Steam will redirect the
//   user back to this application at /auth/steam/return
router.get('/steam',
	authController.user_authenticate,
	authController.user_authenticated);

// GET /auth/steam/return
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.
router.get('/steam/return',
	// Issue #37 - Workaround for Express router module stripping the full url, causing assertion to fail 
	authController.user_url_strip_path, 
	authController.user_authenticate_return);

// 유저 토큰 체크
router.get('/renew',
	authController.user_check_token);

module.exports = router;