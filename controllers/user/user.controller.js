/*
 * 스팀 사용자의 정보를 얻어
 * 게임 서버에 관리 권한이 있는지 확인하고,
 * 얻어낸 정보를 내보내는 역할을 하는 컨트롤러
 * by. Trostal
 */

var steamWeb	= require('steam-web'),
	steam		= new steamWeb({
		apiKey: global.config.steam_api_key,
		foramt: 'json'
	}),
	steamId = require(global.config.root_path+'/app/user/conversion'),
	mcache = require('memory-cache'),
	Promise = require('bluebird'),
	serverAdminController = require('./server-admin.controller');

// 유저 스팀 프로필 정보를 캐시하여 보낸다
exports.user_cached_profile_info = function (steam64, duration=600, forceUpdate=false) {
	return new Promise((resolve,reject) => {
		let cacheKey = '__userSteamProfile__' + steam64;
		let cachedBody = mcache.get(cacheKey);
		if (cachedBody && !forceUpdate) {
			resolve(cachedBody.data);
		} else {
			return exports.user_get_player_summaries(steam64).then((data) => {
				if(data && data.response && data.response.players.length > 0) {
					serverAdminController.user_get_server_permission_list(steam64, function(err, adminData) {
						if(err) reject(err);
						else{
							data.response.players[0].admindata = adminData;
							mcache.put(cacheKey, {err:err, data:data}, duration * 1000);
							resolve(data);
						}
					});
				} else {
					resolve(data);
				}
			});
		}
	});
};

exports.user_search_user = function(req, res){
	var steam64=0, sent=false;
	if(steamId.IsSteamId64(req.params.id)) { // 64비트 아이디 형식으로 입력 받았을 때
		steam64 = req.params.id;
	} else if(steamId.IsSteamId2(req.params.id)) { // STEAMIDv2 로 입력 받았을 때
		steam64 = steamId.SteamID2ToSteamID64(req.params.id);
	} else if(steamId.IsSteamId3(req.params.id)) { // STEAMIDv3 로 입력 받았을 때
		steam64 = steamId.SteamID3ToSteamID64(req.params.id);
	} else if(steamId.IsSteamCommunityUrl(req.params.id)) { // 주소로 입력 받았을 때
		var re = /\/id\/[a-zA-Z0-9]+/;
		var regexResult;
		regexResult = req.params.id.match(re);
		if(regexResult)
		{
			steam64 = regexResult[0].split('/')[2];
		} else {
			re = /\/profiles\/[a-zA-Z0-9]+/;
			regexResult = req.params.id.match(re);
			if(regexResult)
			{
				let Id = regexResult[0].split('/')[2];
				// 커스텀 URL을 통해 SteamId64 구하기
				steam64 = -1;
				steam.resolveVanityURL({
					vanityurl: Id,
					callback: function(err, data) {
						if(err || !data) res.status(200).json({success: false, error: '입력된 값이 잘못되었습니다.'});
						if(data.response.success == 1)
						{
							steam64 = data.response.steamid;
							exports.user_cached_profile_info(steam64, 300, true)
								.then((data) => {
									if(err || !data || typeof data.response.players == 'undefined')	res.status(400).json({success: false, error: '입력된 값이 잘못되었습니다.'});
									if(data.response.players.length != 0)
										res.status(200).json(data.response.players[0]);
									else
										res.status(200).json({success: false, error: '처리하려는 항목을 찾을 수 없습니다.'});
								});
						}
						else {
							res.status(200).json({success: false, error: '입력된 값이 잘못되었습니다.'});
						}
					}
				});
				sent = true;
			}
		}
	} else {
		// 커스텀 URL을 통해 SteamId64 구하기
		steam64 = -1;
		steam.resolveVanityURL({
			vanityurl: req.params.id,
			callback: function(err, data) {
				if(err || !data) res.status(200).json({success: false, error: '입력된 값이 잘못되었습니다.'});
				if(data.response.success == 1)
				{
					steam64 = data.response.steamid;
					exports.user_cached_profile_info(steam64, 300, true)
						.then((data) => {
							if(err || !data || typeof data.response.players == 'undefined')	res.status(400).json({success: false, error: '입력된 값이 잘못되었습니다.'});
							if(data.response.players.length != 0)
								res.status(200).json(data.response.players[0]);
							else
								res.status(200).json({success: false, error: '처리하려는 항목을 찾을 수 없습니다.'});
						});
				}
				else {
					res.status(200).json({success: false, error: '입력된 값이 잘못되었습니다.'});
				}
			}
		});
		sent = true;
	}
	if(steam64 > 0 && !sent)
	{
		exports.user_cached_profile_info(steam64, 300, true)
			.then((data) => {
				if(!data || typeof data.response.players == 'undefined')	res.status(400).json({success: false, error: '입력된 값이 잘못되었습니다.'});
				if(data.response.players.length != 0)
					res.status(200).json(data.response.players[0]);
				else
					res.status(200).json({success: false, error: '처리하려는 항목을 찾을 수 없습니다.'});
			});
	}
	// steamId64 < 0 means we need to resolve User's custom URL, so we don't do something there...
	else if(steam64 == 0) { 
		res.status(200).json({success: false, error: '입력된 값이 잘못되었습니다.'});
	}
};

exports.user_get_player_summaries = function(steam64) {
	return new Promise((resolve, reject) => {
		steam.getPlayerSummaries({
			steamids: steam64,
			callback: (err, data) => {
				if(err) reject(err)
				else resolve(data)
			}
		});
	});
};