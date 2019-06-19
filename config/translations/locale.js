module.exports = function(app){
	const localizify = require('localizify');
	 
	const en = require('./en.json');
	const ko = require('./ko.json');

	localizify
	  .add('en', en)
	  .add('ko', ko)
	  .setLocale('ko');

	app.use((req, res, next) => {
		const lang = (req.cookies.language) ? req.cookies.language : localizify.detectLocale(req.header('accept-language') || 'ko');
	    localizify.setLocale(lang);
	    next();
	});
	
	app.locals.translate = function(key) {
		var data = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
		return localizify.translate(key, data);
	}

	app.get('/lang/:lang', function(req, res){
		res.cookie('language', req.params.lang, { 
			maxAge: 604800000, // a week
			httpOnly: true
		});
		localizify.setLocale(req.params.lang);
		
		var host = req.header('host');
		var referer = req.header('referer');
		var redirectUrl = referer.slice(referer.indexOf(host) + host.length);
		res.redirect(redirectUrl);
	});

	return localizify;
};