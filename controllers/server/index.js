var gameServerManagement = require('./game-server-management.controller');
var gameServerStatus     = require('./game-server-status.controller');

Object.assign(exports, gameServerManagement);
Object.assign(exports, gameServerStatus);


exports.server_init_server_status_timer(10000);
//exports.server_cache = commonController.view_cache_page;

//exports.server_info = function(req, res){
//	let address;
/*
	db.client.query('SELECT address, port FROM sm_servers WHERE id='+req.params.id, function(err, rows, fields) {
		if (err)	throw err;

		address = rows.address + ':' + rows.port;
	});*/
// TODO: https://code.tutsplus.com/tutorials/how-to-scrape-web-pages-with-nodejs-and-jquery--net-22478
// WE NEED TO SCRAPE ANOTHER PAGE
//		commonController.view_render_page(req, res, ejs, rows);
//		res.json({ id: 1, name: "John"});
//		app.get('/nodetube', function(req, res){
//Tell the request that we want to fetch youtube.com, send the results to a callback function
/*
	console.log('Request request came.');
    request({uri: 'http://scripting.com/rss.json'}, function(err, response, body){
        var self = this;
		self.items = new Array();//I feel like I want to save my results in an array
		console.log('Requesting...');
		//Just a basic error check
        if(err && response.statusCode !== 200){console.log('Request error:', err);}
        //Send the body param as the HTML code we will parse in jsdom
		//also tell jsdom to attach jQuery in the scripts and loaded from jQuery.com
		jsdom.env({
            html: body,
            scripts: ['http://code.jquery.com/jquery-1.6.min.js'],
            done: function(err, window){
				//Use jQuery just as in a regular HTML page
                var $ = window.jQuery;
                
            //    console.log($('body'));
            	let rss = JSON.parse($('body').text());
                res.send(rss.rss.version);
                // SUCCESSED!
        	}
        });
    });
}*/