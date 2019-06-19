let path = require('path');

// res.render 이후에 req 변수를 암만 수정한들
// 적용되지 않을것이다! 이미 보내버린 값이니...
exports.view_render_page = function (req, res, ejs, data) {
	let options = {};

	let isAjaxRequest = (req.xhr || req.headers.accept.indexOf('json') > -1);

	options.user = req.user;
	options.template_path = path.join('/', global.config.view_template_path).replace(/[\\]/g, '/');
	options.data = data;

	res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
	res.setHeader('Expires', '-1');
	res.setHeader('Pragma', 'no-cache');
	res.setHeader('Expires', '0');
	
	// 링크를 통해 접근한 경우 (AJAX 사용)
	// content 에 대한 내용물만 던져줘야 한다.
	if(isAjaxRequest)
	{
		options.isAPI = true;
		res.render(path.join(global.config.view_path, global.config.view_template_path, ejs), options);
	}
	else // 직접 URL을 입력하여 접근한 경우 
	{ // 틀만 던져 준 다음에 content를 불러오도록 해야 한다.
		options.content_url = req.originalUrl;
		res.render(global.config.default_view_file, options);
	}
};

//TODO: MAKE SERVER DATA CACHE
//https://goenning.net/2016/02/10/simple-server-side-cache-for-expressjs/
let mcache = require('memory-cache');

exports.view_cache_page = function (duration) {
	return (req, res, next) => {
		let key = '__express__' + req.originalUrl || req.url;
		let cachedBody = mcache.get(key);
		if (cachedBody) {
			res.send(cachedBody);
			return;
		} else {
			res.sendResponse = res.send;
			res.send = (body) => {
				mcache.put(key, body, duration * 1000);
				res.sendResponse(body);
			};
			next();
		}
	};
};