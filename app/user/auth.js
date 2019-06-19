let passport = require('passport')
	, SteamStrategy = require('passport-steam').Strategy;

	/*
let steamWeb	= require('steam-web'),
	steam		= new steamWeb({
		apiKey: global.config.steam_api_key,
		foramt: 'json'
	});*/

module.exports = function(app){

	// Use the SteamStrategy within Passport.
	//   Strategies in passport require a `validate` function, which accept
	//   credentials (in this case, an OpenID identifier and profile), and invoke a
	//   callback with a user object.
	passport.use(new SteamStrategy({
		returnURL: 'http://localhost:3000/auth/steam/return',
		realm: 'http://localhost:3000/',
	//	returnURL: 'http://' + global.config.server_domain_name + ':' + global.config.proxy_server_port +'/auth/steam/return', // nginx를 통한 프록시기능을 사용하면 포트를 붙이지 않는 것이 바람직하다.
	//	realm: 'http://' + global.config.server_domain_name + ':' + global.config.proxy_server_port +'/', // nginx를 통한 프록시기능을 사용하면 포트를 붙이지 않는 것이 바람직하다.
		apiKey: global.config.steam_api_key
	},
	function(identifier, profile, done) {
		// asynchronous verification, for effect...
		process.nextTick(function () {

			// To keep the example simple, the user's Steam profile is returned to
			// represent the logged-in user.  In a typical application, you would want
			// to associate the Steam account with a user record in your database,
			// and return that user instead.
			profile.identifier = identifier;
			return done(null, profile);
		});
	}
	));
	// Initialize Passport!  Also use passport.session() middleware, to support
	// persistent login sessions (recommended).
	app.use(passport.initialize()); // 패스포트를 초기화 할 수 있도록 함

	resetReturnURL();
	function resetReturnURL() {
		if(global.isServerOnline && global.config.server_domain_name !== '') {
		//	passport._strategies.steam._relyingParty.returnUrl = 'http://' + global.config.server_domain_name + ':' + global.config.proxy_server_port +'/auth/steam/return';
		//	passport._strategies.steam._relyingParty.realm = 'http://' + global.config.server_domain_name + ':' + global.config.proxy_server_port +'/';
		} else {
			setTimeout(resetReturnURL, 500);
		}
	}
};