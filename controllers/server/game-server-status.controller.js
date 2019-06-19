/*
 * 게임 서버의 현재 상태(online, vac, password 유/무, 현재맵, 인원수, 서버 이름 등...)를
 * 목록화하고 내보내는 역할을 하는 컨트롤러
 * by. Trostal
 */
var models	= require(global.config.root_path+'/models'),
	mcache 	= require('memory-cache'),
	socketController = require('./socket.controller'),
	userController = require('../user');
	
var SourceQuery = new require('gamedig');
var serverList = null;

exports.server_detail_info = (req, res) => {
	let key = '__serverInfo__' + req.params.id;
	let cachedBody = mcache.get(key);
	if (cachedBody) {
		res.send(cachedBody);
	} else {
		res.status(404).json({success: false, error: '해당 서버 정보를 찾을 수 없습니다.'});
	}
};

exports.server_page = function (req, res) {
	models.Server.findAll({include:[{
		model:models.ServerIcons,
		attributes:['icon_type', 'icon_content'],
		require: true
	}]}).then((rows) => {
		let data = {};
		let serverList = [];
		for(let i=0; i<rows.length; i++){
			let serverInfo = {};
			serverInfo.id = rows[i].id;
			serverInfo.socketConnected = socketController.socket_is_server_connected(rows[i].id);
			serverInfo.address = rows[i].address;
			serverInfo.port = rows[i].port;
			serverInfo.icon = {icon_type: rows[i].ServerIcon.icon_type, icon_content: rows[i].ServerIcon.icon_content};
			let cachedBody = mcache.get('__serverInfo__' + rows[i].id);
			if (cachedBody) {
				let serverDataObj;
				serverDataObj = cachedBody;
				serverInfo.online = true;
				serverInfo.displayname = serverDataObj.server.hostname;
				serverInfo.alias = rows[i].displayname;
				serverInfo.game = serverDataObj.server.game;
				serverInfo.vac = serverDataObj.server.vac | false;
				serverInfo.password = serverDataObj.server.password | false;
				serverInfo.os = serverDataObj.server.os;
				serverInfo.map = serverDataObj.server.map;
				serverInfo.players = serverDataObj.server.players;
				serverInfo.maxplayers = serverDataObj.server.maxplayers;
				serverInfo.team = serverDataObj.team;
				serverInfo.playerInfo = serverDataObj.players;
			} else {
				serverInfo.displayname = rows[i].displayname;
				serverInfo.alias = rows[i].displayname;
				serverInfo.online = false;
			}
			
			serverList.push(serverInfo);
		}

		data.serverInfo = serverList;
		
		res.send(data);
	})
		.catch((err) => {
			console.log(err);
			res.status(500).json({success: false, error: '오류가 발생했습니다.'});
		});
};

exports.server_init_server_status_timer = function(interval) {
	// 먼저 서버를 목록화한다.
	serverList = [];
	models.Server.findAll().then((rows) => {
		for(let i=0; i<rows.length; i++){
			serverList.push({ id: rows[i].id, address: rows[i].address, port: rows[i].port });
		}
		// 목록화가 끝나면 주기적으로 실행하도록 타이머를 등록한다.
		init_query();
		setInterval(init_query, interval);
	});
};

function init_query() {
	for(let i=0; i < serverList.length; i++) {
		// 해당 서버가 소켓에 등록되어있다면 소켓에서 따로 처리하므로 등록하지 않는다.
		if(!socketController.socket_is_server_connected(serverList[i].id)) {
			exports.server_query_server_info(serverList[i].address, serverList[i].port, (err, info) => {
				if(!err){
					let data = {};
					data.server = {};
					data.players = {};

					for(let i=0; i<info.bots.length; i++) {
						info.bots[i].bot = true;
					}

					data.server.hostname = info.name;
					data.server.game = info.raw.folder;
					data.server.ip = info.query.address;
					data.server.port = info.query.port;
					data.server.description = info.raw.game;
					data.server.map = info.map;
					data.server.players = info.raw.numplayers;
					data.server.maxplayers = info.maxplayers;
					data.server.vac = info.raw.secure === 1 ? true : false;
					data.server.appid = info.raw.steamappid;
					data.server.password = info.password === 1 ? true : false;
					if(info.raw.environment === 'w') 
						data.server.os = 'windows';
					else if(info.raw.environment === 'l')
						data.server.os = 'linux';
					else if(info.raw.environment === 'm' || info.raw.environment === 'o')
						data.server.os = 'mac';
					
					data.players.allPlayers = info.players.concat(info.bots);
					exports.server_cache_server_info(serverList[i].id, data, 30000);
				}
			});
		}
	}
}


// csgo에서 모든 플레이어 목록을 보려면 host_players_show 2를 적용해야한다.
exports.server_query_server_info = function(address, port, callback) {
	if(arguments.length < 2) {
		return null; // 인수가 없으면 함수를 실행할 수 없다.
	}
	else if(arguments.length < 3) {
		// callback을 제외한 인수가 1개라면 Server ID가 주어진 경우이다.
		for(let i=0; i < serverList.length; i++) {
			if(serverList.id == address) {
				address = serverList.address;
				port = serverList.port;
				break;
			}
		}		
	}
	// callback을 제외한 인수가 2개라면 address와 port가 주어진 경우이다. 이미 주어져있다면 얻어낼 필요가 없다.

	if(address && port) {
		SourceQuery.query({type:'csgo', host: address, port: port}, (err, state) => {
			callback(err, state);
		});
	}
};

exports.server_user_info = function(server_id, user_id, callback) {

	if(server_id && user_id) {
		userController.user_get_player_summaries(user_id).then((data) => {
			if(data && data.response && data.response.players.length > 0) {
				userController.user_get_specific_server_permission(server_id, user_id, function(err, adminData) {
					if(!err) {
						callback(null, {avatar: data.response.players[0].avatar, permission:adminData});
					} else {
						callback(err, null);
					}
				});
			}
		}).catch((err)=>{callback(err, null)});
	} else {
		callback('Not enough params', null);
	}
};

exports.server_cache_server_info = function(serverid, data, duration) {
	// THINGS....
	let key = '__serverInfo__' + serverid;
	mcache.del(key);
	mcache.put(key, data, duration * 1000);
};