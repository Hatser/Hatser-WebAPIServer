let express = require('express'); // express 로드 (함수형태)
let router = express.Router();
let qs = require('querystring');

router.post('/', (req, res) => {
	let ejs = '/pages/motd-redirector.ejs';
	
	let encodedUrl = qs.escape(req.body.url);
	
	let options = {};
	options.url = encodedUrl;

	res.setHeader('Content-Encoding','none');
	res.setHeader('Connection', 'close');
	res.setHeader('Expires', '0');
	res.render(global.config.view_path + global.config.view_template_path + ejs, options);
});

module.exports = router;