/*
 * 웹 서버를 관리하도록 등록된 관리자의 목록화, 등록 등의 처리를 담당하는 컨트롤러
 * by. Trostal
 */

var models	= require(global.config.root_path+'/models'),
	steamId = require(global.config.root_path+'/app/user/conversion'),
	jwt     = require('jsonwebtoken'),
	userController = require('./user.controller');

exports.user_web_admin_page = function(req, res) {
	let adminData = [];
	let permissionList = {};

	models.WebUsers.findAll({
		include: [
			{
				model: models.WebUserRoles,
				require: true,
				include: [
					{
						model: models.WebRoles,
						require: true,
						include: [
							{
								model: models.WebRolePermissions,
								require: true,
								include: [
									{
										model: models.WebPermissions,
										require: true,
									}
								]
							}
						]
					}
				]
			}
		],
	}).then((rows) => {
		let promises = [];
		rows.forEach((user) => {
			promises.push(userController.user_get_player_summaries(steamId.SteamID32ToSteamID64(user.identity)).then((data) => {
				if(data && data.response && data.response.players.length > 0) {
					data = data.response.players[0];
					data.alias = user.name;
					data.roles = [];

					user.WebUserRoles.forEach((role) => {
						data.roles.push(role.WebRole.role_id);
					});
				}
				adminData.push(data);
			}));
		});
		
		// promise의 성공과 실패 여부 상관없이 어쨋든 모든 작업이 끝나면 실행되도록 한다
		return Promise.all(promises.map(p => p.catch(e => e))).then((data) => {return models.WebPermissions.findAll();});
	}).then((rows) => {
		rows.forEach((e) => {
			permissionList[e.permission_id] = e.permission_name;
		});

		return models.WebRoles.findAll({include: [
			{
				model: models.WebRolePermissions,
				require: true
			}
		]});
	}).then((rows) => {
		let roleList = {};
		rows.forEach((e) => {
			let permissions = [];
			e.WebRolePermissions.forEach((p) => {
				permissions.push(p.permission_id);
			});
			roleList[e.role_id] = {name:e.role_name, permissions:permissions};
		});
		res.json({permissionList, roleList, adminData});
	}).catch((err) => {
		throw err;
	});
};

/*
 * 웹 관리자를 추가/편집한다.
 */
exports.user_web_admin_register = function(req, res) {
	/*
		받아야 하는 정보:
		{
			steamid: '', (steamid64)
			alias: '',
			roles: []
		}
	*/
	// 유저 정보와 역할에 해당하는 역할 정보를 함께 추가해야 하므로 트랜잭션을 이용한다.
	return models.sequelize.transaction(function (t) {
		let roles = req.body.roles;
		let steam32 = steamId.SteamID64ToSteamID32(req.body.steamid);
		let user_id = 0;

		// 모든 쿼리명령을 체이닝한다. 처음 쿼리 메서드를 return으로 넘기는 것을 분명히 할 것.
		return models.WebUsers.findOrCreate({
			where:{identity:steam32},
			defaults:{
				identity: steam32,
				name: req.body.alias
			}
		}, {transaction: t}).then((row) => {
			user_id = row.user_id;
			return models.WebUserRoles.findAll({where:{user_id: user_id}}, {transaction: t});
		}).then((rows) => {
			if(rows.length <= 0) { // 해당하는 고유번호의 행이 하나도 없을 때, 새로 추가
				let bulkArray = [];
				roles.forEach((e) => {
					bulkArray.push({
						user_id: user_id,
						role_id: e
					});
				});
				return models.WebUserRoles.bulkCreate(bulkArray, {transaction: t});
			} else { // 해당하는 고유번호의 행이 하나 이상 있을 때, 적용할 만큼 업데이트하고, 부족분은 추가, 초과분은 삭제해야 한다.
				let promises = [];
				roles.forEach(function(e, i) {
					let bulkArray = [];
					// 현재 수정해도 되는 데이터가 있을 경우
					if(i <= rows.length) {
						promises.push(models.WebUserRoles.update({role_id: e},
							{ where: { user_role_id: rows[i].user_role_id }}, {transaction: t}));
					} else { // 행을 더 추가해줘야 하는 경우
						bulkArray.push({
							user_id: user_id,
							role_id: e
						});
					}
				});

				if(rows.length < roles.length) { // 부족한 만큼 추가해줘야 한다.
					promises.push(models.WebUserRoles.bulkCreate(bulkArray, {transaction: t}));
				}
				else if(rows.length > roles.length) { // 초과분이 있다.. 삭제해야 함
					for(let i=roles.length; i<rows.length; i++) {
						promises.push(models.WebUserRoles.destroy({
							where: {
								user_role_id: rows[i].user_role_id
							}, force: true
						}));
					}
				}
				return Promise.all(promises);
			}
		});
	}).then(function (result) {
		// 트랜잭션이 성공적으로 적용된다.
		// result는 해당 트랜잭션에 대한 Promise 결과값을 받아온다.
		res.status(200).json({success: true, message:'역할 정보가 성공적으로 추가되었습니다.'});
	}).catch(function (err) {
		// 트랜잭션 수행 중 오류가 발생하여 롤백된다.
		// err는 트랜잭션 수행 중 발생한 문제를 받아온다.
		res.status(500).json({success: false, error:'처리 도중 오류가 발생했습니다.'});
		throw err;
	});
};

/*
 * 웹 관리자를 삭제한다.
 */
exports.user_web_admin_delete = function(req, res){
	if(req.params.id) {
		models.WebUsers.destroy({where:{user_id:req.params.id}}).then(() => {
			res.status(200).json({success: true, message:'역할 정보가 성공적으로 삭제되었습니다.'});
		}).catch((err) => {
			res.status(500).json({success: false, error:'처리 도중 오류가 발생했습니다.'});
			throw err;
		});
	} else {
		res.status(200).json({success: false, meesage: '처리하는데 필요한 정보가 부족합니다.'});
	}
};

// 역할을 편집하는 페이지에 필요한 데이터를 보냄
exports.user_web_role_page = function(req, res) {
	// 필요한 정보: permlist, rolelist
	return models.WebRoles.findAll({include: [
		{
			model: models.WebRolePermissions,
			require: true
		}
	]}).then((rows) => {
		let roleList = {};
		let permissionList = {};
		rows.forEach((e) => {
			e.WebRolePermissions.forEach((p) => {
				permissions.push(p.permission_id);
			});
			roleList[e.role_id] = {name:e.role_name, permissions:permissions};
		});
		return models.WebPermissions.findAll();
	}).then((rows) => {
		rows.forEach((e) => {
			permissionList[e.permission_id] = e.permission_name;
		});

		res.status(200).json({roleList:roleList, permissionList:permissionList});
	}).catch((err) => {
		throw err;
	});
};

/*
 * 웹 관리 역할을 추가/편집한다.
 */
exports.user_web_create_role = function(req, res) {
	/*
		받아야 하는 정보:
		{
			name: '',
			permissions: []
		}
	*/
	let permissions = req.body.permissions;

	// 역할 정보와 역할에 해당하는 권한 정보를 함께 추가해야 하므로 트랜잭션을 이용한다.
	return models.sequelize.transaction(function (t) {
		// 모든 쿼리명령을 체이닝한다. 처음 쿼리 메서드를 return으로 넘기는 것을 분명히 할 것.
		let role_id = 0;
		return models.WebRoles.findOrCreate({
			where:{role_name: req.body.name},
			defaults:{role_name: req.body.name}
		}, {transaction: t}).then((row) => {
			role_id = row.role_id;
			return models.WebRolePermissions.findAll({where:{role_id: role_id}}, {transaction: t});
		})
			.then((rows) => {
				if(rows.length <= 0) { // 해당하는 역할 이름의 행이 하나도 없을 때, 새로 추가
					let bulkArray = [];
					permissions.forEach((e) => {
						bulkArray.push({
							role_id: role_id,
							permission_id: e
						});
					});
				
					return models.WebRolePermissions.bulkCreate(bulkArray, {transaction: t});
				} else { // 해당하는 고유번호의 행이 하나 이상 있을 때, 적용할 만큼 업데이트하고, 부족분은 추가, 초과분은 삭제해야 한다.
				 let promises = [];
				 permissions.forEach(function(e, i) {
					 let bulkArray = [];
					 // 현재 수정해도 되는 데이터가 있을 경우
					 if(i <= rows.length) {
						 promises.push(models.WebRolePermissions.update({permission_id: e},
						 { where: { role_permission_id: rows[i].role_permission_id }}, {transaction: t}));
					 } else { // 행을 더 추가해줘야 하는 경우
						 bulkArray.push({
								role_id: role_id,
								permission_id: e
						 });
					 }
				 });
 
				 if(rows.length < permissions.length) { // 부족한 만큼 추가해줘야 한다.
					 promises.push(models.WebRolePermissions.bulkCreate(bulkArray, {transaction: t}));
				 }
				 else if(rows.length > permissions.length) { // 초과분이 있다.. 삭제해야 함
					 for(let i=permissions.length; i<rows.length; i++) {
						 promises.push(models.WebRolePermissions.destroy({
							 where: {
									role_permission_id: rows[i].role_permission_id
							 }, force: true
						 }));
					 }
				 }
				 return Promise.all(promises);
				}
			});
	}).then(function (result) {
		// 트랜잭션이 성공적으로 적용된다.
		// result는 해당 트랜잭션에 대한 Promise 결과값을 받아온다.
		res.status(200).json({success: true, message:'역할 정보가 성공적으로 추가되었습니다.'});
	}).catch(function (err) {
		// 트랜잭션 수행 중 오류가 발생하여 롤백된다.
		// err는 트랜잭션 수행 중 발생한 문제를 받아온다.
		res.status(500).json({success: false, error:'처리 도중 오류가 발생했습니다.'});
		throw err;
	});
};

/*
 * 웹 관리 역할을 삭제한다.
 */
exports.user_web_delete_role = function(req, res) {
	if(req.params.id) {
		models.WebRoles.destroy({where:{role_id:req.params.id}}).then(() => {
			res.status(200).json({success: true, message:'역할 정보가 성공적으로 삭제되었습니다.'});
		}).catch((err) => {
			res.status(500).json({success: false, error:'처리 도중 오류가 발생했습니다.'});
			throw err;
		});
	} else {
		res.status(200).json({success: false, meesage: '처리하는데 필요한 정보가 부족합니다.'});
	}
};

exports.user_get_web_permission_list = function(steamId64, callback) {
	// 유저 STEAMID 32 구하기
	let steamId32;
	let result = [];
	steamId32 = steamId.SteamID64ToSteamID32(steamId64);
	// 유저 고유번호를 통해 id를 얻어냄
	models.WebUsers.findAll({
		where: {identity: steamId32},
		include: [
			{
				model: models.WebUserRoles,
				require: true,
				include: [
					{
						model: models.WebRoles,
						require: true,
						include: [
							{
								model: models.WebRolePermissions,
								require: true,
								include: [
									{
										attributes: [[ models.sequelize.col('permission_id'), 'permission_id' ], [models.sequelize.col('permission_constant_name'), 'permission_constant_name']],
										model: models.WebPermissions,
										require: true,
									}
								]
							}
						]
					}
				]
			}
		],
		group: [[models.sequelize.literal('(`WebUserRoles.WebRole.WebRolePermissions.permission_id`)')]]
	}).then((rows) => {
		
		let row = rows[0];

		// 목록을 DB로 부터 찾은 경우
		if(row && row.WebUserRoles.length > 0) { 
			for(let roleKey in row.WebUserRoles) {
				for(let permKey in row.WebUserRoles[roleKey].WebRole.WebRolePermissions) {
					result.push(row.WebUserRoles[roleKey].WebRole.WebRolePermissions[permKey].WebPermission.permission_constant_name);
				}
			}
		}

		callback(null, result);
	}).catch((err) => {
		console.log(err);
		callback(err, null);
	});
};

// 유저가 가진 권한을 배열 형태로 기록한다.
exports.user_sessionize_web_permissions = function(req, res, next) {
	if(req.user){ // 유저 정보가 있다면
		exports.user_get_web_permission_list(req.user.id, function(err, data) {
			if(!err)
				req.user.permissionList = data;
			next();
		});
	} else { // 유저 정보가 없을 때, 로그인 상태가 아닐 때
		next();
	}
};

// 유저에게 권한이 있는지 판별한다.
exports.user_check_web_permissions = (permisionConstantName) => {
	// 함수가 중복으로 생성되는 것을 방지하자...
	return this.user_check_web_permissions[permisionConstantName] || (this.user_check_web_permissions[permisionConstantName] = function(req, res, next) {
		// TODO: req를 통한 인증을 할 경우, DB를 계속 참조시키게 되면 부하가 더 걸리지만, 정보 갱신에 대한 신뢰성을 얻을 수 있다.
		if(req.user && req.user.webPermissions){
			if(req.user.webPermissions.indexOf(permisionConstantName) >= 0)
				next();
			else
				res.status(401).json({success:false, message:'권한이 부족합니다'});
		} else {
			if(req.cookies.token) {
				jwt.verify(req.cookies.token, global.config.jwt_token_secret_key, function(err, decode){
					if(err) {
						res.status(401).json({success:false, message:'권한이 부족합니다'});
					} else {
						if(decode.user.webPermissions.indexOf(permisionConstantName) >= 0)
							next();
						else
							res.status(401).json({success:false, message:'권한이 부족합니다'});
					}
				});
			} else {
				res.status(401).json({success:false, message:'권한이 부족합니다'});
			}
		}
	});
};