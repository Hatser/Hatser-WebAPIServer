/*
 * 게임 서버에 등록된 관리자의 목록화, 등록 등의 처리를 담당하는 컨트롤러
 * by. Trostal
 */
var models	= require(global.config.root_path+'/models'),
	steamId = require(global.config.root_path+'/app/user/conversion'),
	userController = require('./user.controller');

const { t } = require('localizify');

exports.user_server_admin_page = function (req, res) {
	//TODO: 이쪽페이지 권한구현, auth를 기준으로 권한, 면역을 뭉치기, 해당 서버를 알아야 한다...
	//SELECT , group_concat(id order by id) AS id, identity, group_concat(flags order by id) AS flags, group_concat(immunity order by id) AS immunity FROM sm_admins WHERE authtype='steam' GROUP BY identity;
	models.Admin
		.findAll({
			attributes: ['identity'],
			where: {authtype: 'steam'},
			group: 'identity'})
		.then((rows) => {
			let adminData = [];
			let promises = [];		
			for(let key in rows){
				let steam64 = steamId.SteamID2ToSteamID64(rows[key].dataValues.identity);
				let i = key;
				promises.push(
					userController.user_cached_profile_info(steam64, 300, true).then((data) => {
						if(data.response.players.length != 0) {
							adminData[i] = data.response.players[0];
							Promise.resolve();
						} else {
							Promise.reject();
						}
					}));
			}

			let serverData = {};
			promises.push(
				models.Server.findAll({
					include:[{
						model:models.ServerIcons,
						attributes:['icon_type', 'icon_content'],
						require: true
					}]}).then((rows) => {
					for(let key in rows){
						let icon;
						if(rows[key].dataValues.ServerIcon != null) {
							icon = rows[key].dataValues.ServerIcon;
						}
						serverData[rows[key].dataValues.id] = {id:rows[key].dataValues.id, displayname:rows[key].dataValues.displayname, address:rows[key].dataValues.address, port:rows[key].dataValues.port, icon:icon};
					}
				}));
		
			Promise.all(promises).then(() => {
				let options = {};
				options.adminData = adminData;
				options.serverData = serverData;
				if(req.user && req.user.permissionList)
					options.userPermissions = req.user.permissionList;
				res.send(options);
			});
		})
		.catch((err) => {
			throw err;
		});
};

exports.user_admin_register = function (req, res) {
	// TODO: 관리자 추가하기 전에 마지막으로 한 번 더 유저 존재하는지 체크한 뒤에 적용!
	if(req.body && req.params.id)
	{
		//https://raw.githubusercontent.com/alliedmodders/sourcemod/master/plugins/sql-admin-manager.sp
		let identity = steamId.SteamID64ToSteamID2(models.sequelize.escape(req.params.id).replace(/["']/g, ''));
		let alias = req.body.alias; // STRING 변수가 escape 함수를 쓰면 '' 를 달고나옴, 계산 할 건 다 한 뒤에 마지막에 사용하자
		let serverPermissions = req.body.permissions;
		// "SELECT id FROM sm_admins WHERE authtype = 'steam' AND identity = '" + identity + "'"
		// "INSERT INTO sm_admins (authtype, identity, password, flags, name, immunity) VALUES ('steam', '" + identity + "', NULL, '" + flags + "', '" + alias +"', '" + immunity + "');"
		models.Admin.findAll({
			where: {authtype: 'steam', identity: identity}
		}/*, {transaction: t}*/)
			.then((rows) => {
				if(rows.length <= 0) // id에 해당하는 열이 없을 때, 새로 입력
				{
					let serverKey = [];
					let bulkArray = []; // 어드민 테이블에 들어가야 할 row들을 모아놓는다.
					for(let key in serverPermissions) {
						let flags = serverPermissions[key].flags;
						let immunity = serverPermissions[key].immunity;
						let server = parseInt(serverPermissions[key].server);
						if(flags != '' && !isNaN(server)) {
							bulkArray.push({
								authtype: 'steam',
								identity: identity,
								password: null,
								flags: flags,
								name: alias,
								immunity: immunity
							});

							serverKey.push(server);
						}
					}

					return models.Admin
						.bulkCreate(bulkArray, {/*transaction: t, */hooks:true})
						.then((data) => {
							for(let key in data) {
								models.AdminServer.create({
									admin_id: data[key].id,
									server_id: serverKey.shift()
								});
							}
						}, {/*transaction: t, */});
				} else {   // id에 해당하는 열이 있을 때
					/* 		예시 1					예시 2
						기존값	새 값  			기존값	새 값
						rows	servers  		rows	servers
						1		1				1		1
						2		2				2		2
						3		3				3		3
						4								4
						5								5
					일 때 */
					// servers.length 가 더 크다는 전제
					let promises = [];
					let serverKey = [];
					let bulkArray = [];
					let serverCount = 0;
					for(let key in serverPermissions) {
						let flags = serverPermissions[key].flags;
						let immunity = serverPermissions[key].immunity;
						let server = parseInt(serverPermissions[key].server);

						if(flags != '' && !isNaN(server)) {
							serverCount++;
							// 현재 serverCount가 이전 데이터갯수보다 작거나 같은 상태일 때, 수정해도되는 데이터가 있을 경우
							if(serverCount <= rows.length) {
								let adminId= rows[serverCount-1].dataValues.id;
								let newPromise = models.Admin
									.update({
										flags: flags,
										name:  alias,
										immunity: immunity}, // set attributes' value
									{ where: { id: adminId }}, {/*transaction: t,*/})
									.then(() => {
										return models.AdminServer
											.update({
												server_id: server
											}, {where: {admin_id: adminId}});
									});

								promises.push(newPromise);
							} else {
								bulkArray.push({
									authtype: 'steam',
									identity: identity,
									password: null,
									flags: flags,
									name: alias,
									immunity: immunity
								});
								serverKey.push(server);
							}
						}
					}
					//  부족분 추가
					if(serverCount > rows.length) {
						promises.push(models.Admin
							.bulkCreate(bulkArray, {/*transaction: t*/hooks:true})
							.then((data) => {
								for(let key in data) {
									models.AdminServer.create({
										admin_id: data[key].id,
										server_id: serverKey.shift()
									});
								}
							}, {/*transaction: t, */}));
					}

					/* 		예시 1					예시 2
						기존값	새 값  			기존값	새 값
						rows	servers  		rows	servers
					*	1		1			*	1		1
					*	2		2			*	2		2
					*	3		3			*	3		3
						4					*			4
						5					*			5
					* 는 값이 수정(추가)되었다는 표시 */

					// 기존 데이터 중에서 해당하지 않는 데이터는 삭제
					if(rows.length > serverCount) {
						for(let i=serverCount; i<rows.length; i++) {
							let newPromise = models.Admin.destroy({
								where: {
									id: rows[i].id
								}, force: true
							}).then((/*data*/) => {
								return models.AdminServer.destroy({
									where: {
										admin_id: rows[i].id
									}, force: true
								});
							});

							promises.push(newPromise);
						}
					}
					
					return Promise.all(promises);/*.then(function(users) {
						var userPromises = [];
						for (var i = 0; i < users.length; i++) {
							userPromises.push(users[i].addInvitations([group], {transaction: t}));
						}
						return Promise.all(userPromises);
					});*/

					/* 		예시 1
							기존값	새 값
							rows	servers
						*	1		1
						*	2		2
						*	3		3
						-	4
						-	5
						- 는 값이 삭제되었다는 표시 */
				}
			}).then((data) => {
				res.status(200).json({success: true, message: t('web.administrator.applied_successfully'), data: data});				
			}).catch((/*err*/) => {
				res.status(200).json({success: false, error: t('web.administrator.failed_to_apply')});
			});
	}
};

exports.user_admin_delete = function(req, res) {
	let steam64 = req.params.id;
	let steamId2 = steamId.SteamID64ToSteamID2(steam64);
	models.Admin.destroy({
		where:{identity: steamId2}
	}).then(() => {
		res.status(200).json({success: true, message: t('web.administrator.deleted_successfully')});
	}).catch((/*err*/) => {
		res.status(200).json({success: false, error: t('web.administrator.failed_to_delete')});
	});
};

exports.user_get_server_permission_list = function(steamId64, callback) {
	models.Admin
		.findAll({
			attributes: [
				[models.sequelize.fn('group_concat', models.sequelize.literal('`id` ORDER BY id')), 'id'],
				'identity',
				'name',
				[models.sequelize.fn('group_concat', models.sequelize.literal('`flags` ORDER BY id')), 'flags'],
				[models.sequelize.fn('group_concat', models.sequelize.literal('`immunity` ORDER BY id')), 'immunity'],
				[models.sequelize.fn('group_concat', models.sequelize.literal('(SELECT `server_id` FROM `sm_admins_servers` AS `AdminServer` WHERE `Admin`.`id` = `AdminServer`.`admin_id`)')), 'server']
			],
			where: {authtype: 'steam', identity: steamId.SteamID64ToSteamID2(steamId64)},
			group: 'identity'
		})
		.then((rows) => {
			let adminData = {};
			for(let key in rows){
				let flags = rows[key].flags.split(',');
				let immunity = rows[key].immunity.split(',');
				let server = rows[key].dataValues.server.split(',');
				let permissions = new Object();
				
				for(let i=0; i<server.length; i++){
					permissions[server[i]] = {server:server[i], flags:flags[i], immunity:immunity[i]};
				}
				
				adminData = {alias:rows[key].name, permissions:permissions, permServerCount:Object.keys(permissions).length.toString()};
			}
			if(Object.keys(adminData).length > 0) {
				callback(null, adminData);
			} else {
				callback(null, null);
			}
		}).catch((err) => {
			console.log(err);
			callback(err, null);
		});
};

exports.user_get_specific_server_permission = function(server_id, steamId64, callback) {
	models.Admin
		.findOne({
			include: [{
				model:models.AdminServer,
				where: {server_id: server_id},
				require: true
			}],
			where: {authtype: 'steam', identity: steamId.SteamID64ToSteamID2(steamId64)},
		})
		.then((row) => {
			if(row){
				callback(null, {flags: row.flags, immunity: row.immunity});
			} else {
				callback(null, null);
			}
		}).catch((err) => {
			callback(err, null);
		});
};