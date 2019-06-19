/*
 * 게임 서버와 websocket 통신을 담당하는 컨트롤러
 * by. Trostal
 */

var models	= require(global.config.root_path+'/models');
var gameServerStatus = require('./game-server-status.controller');
var jwt     = require('jsonwebtoken');
var socketServer = null;

var SRCDSclients = {};
var webUsers = [];
var channels = [{id:'common', name:'웹 채팅'}];

/*
 * 소켓의 초기처리를 담당하는 메서드
 */
exports.socket_init = function (io){
	socketServer = io;

	// usernames which are currently connected to the chat
	io.set('transports', ['websocket', 'flashsocket', 'xhr-polling', 'polling']);
	let wildio = require('socketio-wildcard')();

	io.use(wildio);

	// 모든 소켓 요청시 마다 토큰을 검증하여 유저 정보를 소켓에 담는다.
	// 주의! 브라우저는 보안 상 Host(목적지 서버 주소) 와 Origin(실제 사용자가 접속해있는 서버 주소)가 같아야
	// 사전에 저장된 쿠키를 보내오기 때문에, 서버 주소를 맞춰줄 필요가 있다(ip 주소 <--> 도메인 주소의 경우에도 쿠키를 보내지 않는다.)
	io.use(function(socket, next){
		// 게임 서버가 아닌 일반 웹 유저일 때
		if(socket.handshake.query.clienttype !== 'SRCDS') {
			console.log(socket.handshake);
			var token = parseCookies(socket.handshake.headers.cookie).token;
			if (token){
				jwt.verify(token, global.config.jwt_token_secret_key, function(err, decoded) {	
					if(err) return next(new Error('Authentication error'));
					socket.user = decoded.user;
					next();
				});
			}
			next(new Error('Authentication error'));
		} else { // 게임 서버를 통한 접속일 때
			next();
		}
	});
	
	io.on('connection', function (socket) {
		console.log(socket);
		if(socket.handshake.query.clienttype == 'SRCDS') { // 게임 서버가 접속한 경우
			exports.socket_on_game_server_connection(io, socket);
		} else { // 이외 다른 유저가 웹을 통해 접속한 경우
			exports.socket_on_user_connection(io, socket);
		}

		// 디버그용
		socket.on('*', function(value1) {
			console.log('Event "' + value1.data[0] + '" fired! values are: ');
			console.log(value1.data[1]);
		});
		
		socket.on('disconnecting', function(reason){
			exports.socket_on_disconnect_pre(io, socket, reason);
		});

		// when the user disconnects.. perform this
		socket.on('disconnect', function(reason){
			if(socket.autoPing)
				clearInterval(socket.autoPing);
			
			exports.socket_on_disconnect(io, socket, reason);
			
			// 해당 유저를 목록에서 지운다.
			webUsers.splice(webUsers.indexOf(socket.id), 1);
			// update list of users in chat, client-side
			io.sockets.emit('updateusers', getWebUserListData(io));
			// echo globally that this client has left
			socket.broadcast.emit('updatechat', 'common', {displayName:'Server Chat'}, socket.user.personaname + ' has disconnected');
		});
	});
};

/*
 * 배열에 정리되어있는 소켓 id를 통해 사용자의 정보를 얻어낸다.
 * 당연히 소켓 객체안에 유저정보를 사전에 넣어놓을 필요가 있다.
 */
function getWebUserListData(io, getSocketId) {
	var result = [];
	webUsers.forEach((e) => {
		if(io.sockets.sockets[e]) {
			let socket = io.sockets.sockets[e];
			if(getSocketId)
				result.push(getUserInfoFromSocketUserData(socket.user, socket));
			else
				result.push(getUserInfoFromSocketUserData(socket.user));
		}
	});
	return result;
}

/*
 * 소켓객체안에 저장된 유저정보는 유저의 인증정보(토큰 정보)와 같은 내용이지만,
 * 이를 소켓을 통해 전송하려면 필요한 내용만 담는것이 좋다.
 */
function getUserInfoFromSocketUserData(user, socket) {
	let socketid;
	if(socket)	socketid = socket.id;
	return {
		steamid:user.steamid,
		displayName:user.personaname,
		avatar:user.avatar,
		webPermissions:user.webPermissions,
		serverPermissions:user.serverPermissions,
		socketid:socketid
	};
}

/*
 * 같은 steamid로 소켓에 접속된 유저가 있는지 확인하고 있다면 그 소켓 객체를 반환한다.
 * 중복 체크 시에는 webUsers배열에 값을 넣기 전에 체크하여 연결을 중단해야 한다.
 */
function getSocketFromSteamId(io, steamid) {
	return getWebUserListData(io, true).find(function(e){return e.id === steamid;});
}

/*
 * 웹을 통해 유저가 소켓에 접속했을 때의 처리
 */
exports.socket_on_user_connection = function(io, socket) {
	let oldSocket = getSocketFromSteamId(io, socket.user.steamid);
	if(oldSocket){
		io.sockets.sockets[oldSocket.socketid].disconnect(true);
	}

	webUsers.push(socket.id); // 웹 유저들을 따로 모아서 나중에 리스트 출력용으로 사용하자.
	socket.join('common');
	socket.emit('notifychannels', channels);

	// 유저가 채팅을 보내왔을 때
	socket.on('sendchat', function (channel, data) {
		io.sockets.in(channel).emit('updatechat', channel, {id:socket.user.steamid, displayName:socket.user.personaname}, data); //자신포함 전체 룸안의 유저에게 전송한다.
	});

	// when the client emits 'adduser', this listens and executes
	socket.on('adduser', function(){
		// echo to client they've connected	
		socket.emit('updatechat', 'common', {displayName:'Server Chat'}, 'Welcome! your name is ' + socket.user.personaname);
		// update the list of users in chat, client-side
		io.sockets.in('common').emit('updateusers', getWebUserListData(io));
		console.log(getWebUserListData(io));
	});
};

/*
 * 게임 서버가 소켓에 접속했을 때의 처리
 */
exports.socket_on_game_server_connection = function (io, socket) {
	// SRCDS 서버일 경우
	// 20초 안에 서버정보를 안보내주면 팅군다.
	socket.serverInfoTimeout = setTimeout(function(){ socket.disconnect(true); }, 20000);

	io.to(socket.id).emit('RequestServerInfo');

	socket.autoPing = setInterval(()=>{
		socket.emit('ping');
	}, socket.server.eio.pingInterval);

	socket.on('pong', function(){
		this.conn.setPingTimeout();
	});

	socket.on('ServerInfo', (data) => {
		//타이머가 남아있다면...
		if(socket.serverInfoTimeout) {
			// 서버정보를 보내줬으니 타이머를 지워준다.
			clearTimeout(socket.serverInfoTimeout);
		}
		
		data.players.spectators = Object.values(data.players.spectators);
		data.players.team1 = Object.values(data.players.team1);
		data.players.team2 = Object.values(data.players.team2);
		data.players.unassigned = Object.values(data.players.unassigned);

		// 기존에 등록된 소켓이 없다면...
		if(!socket.SRCDServerId || !SRCDSclients[socket.SRCDServerId] || SRCDSclients[socket.SRCDServerId] !== socket.id) {
			// 없다면 찾아야 한다.
			// 해당하는 서버를 DB에서 찾는다.
			const dns = require('dns');

			models.Server.findAll({
				attributes:['id', 'address', 'port']
			}).then((rows) => {
				let promises = [];
				for(let i=0; i<rows.length; i++) {
					if(/^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/.test(rows[i].address)) {
						promises.push(new Promise(function(resolve, reject) {
							if(rows[i].address == data.server.ip && rows[i].port == data.server.port) {
								// 객체안에 DB상의 서버 아이디에 해당하는 소켓 클라이언트 아이디를 인덱싱한다.
								SRCDSclients[rows[i].id] = socket.id;
								// 나중에 써먹을 수 있도록 소켓 클라이언트 객체 안에도 DB상의 서버 아이디를 넣는다.
								socket.SRCDServerId = rows[i].id;
								io.to(socket.id).emit('LinkSucceed', 'The link between web and game server was done successfully.');
								socket.join('server_'+rows[i].id);
								channels.push({id:'server_'+rows[i].id, name:rows[i].displayname});
							}
						}));
					} else if(/^([a-z\d](-*[a-z\d])*)(\.([a-z\d](-*[a-z\d])*))*$/i.test(rows[i].address)) {
						promises.push(new Promise(function(resolve, reject) {
							dns.lookup(rows[i].address, (err, address, family) => {
								if(!err)
									if(address == data.server.ip && rows[i].port == data.server.port) {
										// 객체안에 DB상의 서버 아이디에 해당하는 소켓 클라이언트 아이디를 인덱싱한다.
										SRCDSclients[rows[i].id] = socket.id;
										// 나중에 써먹을 수 있도록 소켓 클라이언트 객체 안에도 DB상의 서버 아이디를 넣는다.
										socket.SRCDServerId = rows[i].id;
										io.to(socket.id).emit('LinkSucceed', 'The link between web and game server was done successfully.');
										socket.join('server_'+rows[i].id);
										channels.push({id:'server_'+rows[i].id, name:rows[i].displayname});
									}
							});
						}));
					}
				}
				Promise.all(promises).then(()=>{
					if(!socket.SRCDServerId) {
						io.to(socket.id).emit('NeedRegistration', 'The server isn\'t registred yet.');
						socket.disconnect(true);
					} else {
						// 서버에서 보내준 유저 정보에다가 아바타와 관리자 정보를 붙여 놓는다.
						for(let t in data.players) {
							data.players[t].forEach(function(e, i) {
								if(!e.bot) {
									gameServerStatus.server_user_info(socket.SRCDServerId, e.authid, function(err, data){
										e.avatar = data.avatar;
										e.permission = data.permission;
									});
								}
							});
						}
					}
				});
			});
		} else {
			for(let t in data.players) {
				// 서버에서 보내준 유저 정보에다가 아바타와 관리자 정보를 붙여 놓는다.
				data.players[t].forEach(function(e, i) {
					if(!e.bot) {
						gameServerStatus.server_user_info(socket.SRCDServerId, e.authid, function(err, data){
							e.avatar = data.avatar;
							e.permission = data.permission;
						});
					}
				});
			}
		}

		gameServerStatus.server_query_server_info(data.server.ip, data.server.port, function(err, info){
			if(!err) {
				data.server.vac = info.raw.secure === 1 ? true : false;
				data.server.appid = info.raw.steamappid;
				data.server.password = info.password === 1 ? true : false;
				if(info.raw.environment === 'w') 
					data.server.os = 'windows';
				else if(info.raw.environment === 'l')
					data.server.os = 'linux';
				else if(info.raw.environment === 'm' || info.raw.environment === 'o')
					data.server.os = 'mac';
			}
			if(socket.SRCDServerId) {
				gameServerStatus.server_cache_server_info(socket.SRCDServerId, data, 30);
			}
		});

		
		setTimeout(function(){
			io.to(socket.id).emit('RequestServerInfo');
		}, 30000);
	});
};

/*
 * 대상이 서버에서 끊기기 전 처리
 */
exports.socket_on_disconnect_pre = (io, socket, reason) => {
	
};

/*
 * 대상이 서버에서 끊긴 후 처리
 */
exports.socket_on_disconnect = (io, socket, reason) => {
	// 인덱싱했던 소켓 클라이언트 아이디를 지운다.
	// 안지우면 나중에 소켓연결이 끊겨있는 상황에서도 연결되어있다고 인식할 것이다.
	if(SRCDSclients[socket.SRCDServerId])
		delete SRCDSclients[socket.SRCDServerId];
};

/*
 * 해당 ID의 게임 서버가 소켓에 연결되었는지를 판별한다.
 */
exports.socket_is_server_connected = (serverId) => {
	if(SRCDSclients[serverId]) {
		return true;
	} else {
		return false;
	}
};

/*
 * 소켓에 연결된 서버 목록에서 해당 서버를 삭제한다.
 */
exports.socket_delete_server = (serverId) => {
	if(socketServer) {
		if(SRCDSclients[serverId]) {
			socketServer.to(SRCDSclients[serverId]).disconnect(true);
			delete SRCDSclients[serverId];
		}
	}
};

function parseCookies (cookieString) {
	var list = {};

	cookieString && cookieString.split(';').forEach(function( cookie ) {
		var parts = cookie.split('=');
		list[parts.shift().trim()] = decodeURI(parts.join('='));
	});

	return list;
}