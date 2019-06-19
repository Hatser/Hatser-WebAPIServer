/*
 * 소속된 게임 서버의 정보(ip:port, 서버 아이콘 등...)의
 * 등록/삭제를 담당하는 컨트롤러 
 * by. Trostal
 */

var multer	= require('multer'),
	fs		= require('fs'),
	models	= require(global.config.root_path+'/models'),
	mcache 	= require('memory-cache'),
	socketController = require('./socket.controller');
 
var imageUpload = multer({
	storage: multer.diskStorage({
		destination: function(req, file, cb) {
			cb(null, 'public/images/servers/icons');
		},
		/*
		filename: function(req, file, cb) {
			if(req.params.id) {
				cb(null, file.fieldname + '-' + req.params.id + path.extname(file.originalname));
			} else {
				
			}
		},*/
	}),
	fileFilter: function(req, file, cb) {
		// 파일 업로드를 수락한다
		if(req.body.icon_type == 'image') {
			cb(null, true);
		} else {
			cb(null, false);
		}
		
	},
	limits: { fileSize: 2 * 1024 * 1024 }
});

exports.server_edit_page = function(req, res) {

	let data = null;
	models.Server.findOne({
		where:{id:req.params.id},
		include:[{
			model:models.ServerIcons,
			attributes:['icon_type', 'icon_content'],
			require: true
		}]})
		.then((row) => {
			data = {id:row.id, displayname:row.displayname, address:row.address, port:row.port, icon:row.ServerIcon};
			res.status(200).send(data);
		});
};

exports.server_receive_uploaded_file = imageUpload.single('icon_image_file');

exports.server_register = function(req, res) {
	let serverInfo = req.body;

	if(req.body.icon_type === 'image') {
		if(req.file) {
			serverInfo.icon_content = req.file.filename;
		} else {// 파일을 찾을 수 없다면 폰트로 바꾼다.
			serverInfo.icon_type = 'font';
			serverInfo.icon_content = 'fas fa-server';
		}
	}

	// 서버 정보와 서버 아이콘 정보를 함께 추가해야 하므로 트랜잭션을 이용한다.
	// * 서버 정보는 성공적으로 추가됐으나, 아이콘 정보 추가에 오류가 발생할 시 데이터가 결여되어 문제가 발생하므로
	return models.sequelize.transaction(function (t) {
		// 모든 쿼리명령을 체이닝한다. 처음 쿼리 메서드를 return으로 넘기는 것을 분명히 할 것.
		return models.Server.create({
			displayname: serverInfo.displayname,
			address: serverInfo.address,
			port: serverInfo.port
		}, {transaction: t})
			.then((row)=>{
				return models.ServerIcons.create({
					server_id: row.id,
					icon_type: serverInfo.icon_type,
					icon_content: serverInfo.icon_content
				}, {transaction: t});
			});
	}).then(function (result) {
		// 트랜잭션이 성공적으로 적용된다.
		// result는 해당 트랜잭션에 대한 Promise 결과값을 받아온다.
		res.status(200).json({success: true, message:'서버 정보가 성공적으로 추가되었습니다.'});
	}).catch(function (err) {
		// 트랜잭션 수행 중 오류가 발생하여 롤백된다.
		// err는 트랜잭션 수행 중 발생한 문제를 받아온다.
		console.log(err);
		res.status(500).json({success: false, error:'처리 도중 오류가 발생했습니다.'});
	});
};

exports.server_edit = function(req, res) {
	let serverInfo = req.body;

	if(req.body.icon_type === 'image') {
		if(req.file) {
			serverInfo.icon_content = req.file.filename;
		} else {// 파일을 찾을 수 없다면 폰트로 바꾼다.
			serverInfo.icon_type = 'font';
			serverInfo.icon_content = 'fas fa-server';
		}
	}

	return models.sequelize.transaction(function (t) {
		return models.Server.findOne({
			where:{id:req.params.id},
			include:[{
				model:models.ServerIcons,
				attributes:['icon_type', 'icon_content'],
				require: true
			}]}, {transaction: t})
			.then((row) => {
				if(req.body.icon_type) {
					if(row.ServerIcon.icon_type === 'image') {
						fs.access('public/images/servers/icons/' + row.ServerIcon.icon_content, fs.constants.F_OK | fs.constants.W_OK, (err) => {
							if(!err)
								fs.unlinkSync('public/images/servers/icons/' + row.ServerIcon.icon_content); // 기존 아이콘을 지운다.
						});
					}
				}

				return models.Server.update({
					displayname: serverInfo.displayname,
					address: serverInfo.address,
					port: serverInfo.port
				}, {where: {id: row.id}}, {transaction: t})
					.then(()=>{
						if(req.body.icon_type) {
							return models.ServerIcons.update({
								icon_type: serverInfo.icon_type,
								icon_content: serverInfo.icon_content
							}, {where: {server_id: row.id}}, {transaction: t});
						}
					});
			});
	}).then((result) => {
		res.status(200).json({success:true, message: '서버 정보가 수정되었습니다.'});
	}).catch((err) => {
		console.log(err);
		res.status(200).json({success:false, error: '서버 정보 수정 도중 오류가 발생했습니다.'});
	});
};

exports.server_delete_page = function(req, res) {
	let serverInfo = null;
	models.Server.findOne({
		where:{id:req.params.id},
		include:[{
			model:models.ServerIcons,
			attributes:['icon_type', 'icon_content'],
			require: true
		}]})
		.then((row) => {
			if(row) {
				console.log(row);
				let cachedBody = mcache.get('__serverInfo__' + row.id);
				let serverInfo = {};
				serverInfo.type = 'server';
				
				serverInfo.server_id = row.id;
				serverInfo.icon = {};
				serverInfo.icon.icon_type = row.ServerIcon.icon_type;
				serverInfo.icon.icon_content = row.ServerIcon.icon_content;
				if (cachedBody) {
					let serverDataObj;
					if(typeof cachedBody === 'string'){
						serverDataObj = JSON.parse(cachedBody);
						console.log('스트링');
					}
					else if (typeof cachedBody === 'object'){
						serverDataObj = cachedBody;
						console.log('오브젝트');
					}
					
					serverInfo.displayname = serverDataObj.server.name;
					serverInfo.alias = row.displayname;
				} else {
					serverInfo.displayname = row.displayname;
				}
				console.log(serverInfo);
				res.status(200).send(serverInfo);
			}
		})
		.catch((err) => {
			console.log(err);
			res.status(500).json({success: false, error: '오류가 발생했습니다.'});
		});
};


exports.server_delete = (req, res) => {
	if(req.params.id) {
		models.Server.findOne({
			where:{id:req.params.id},
			include:[{
				model:models.ServerIcons,
				attributes:['icon_type', 'icon_content'],
				require: true
			}]})
			.then((row) => {
				if(row.ServerIcon.icon_type === 'image') {
					fs.access('public/images/servers/icons/' + row.ServerIcon.icon_content, fs.constants.F_OK | fs.constants.W_OK, (err) => {
						if(!err)
							fs.unlinkSync('public/images/servers/icons/' + row.ServerIcon.icon_content); // 기존 아이콘을 지운다.
					});
				}

				return models.Server.destroy({where:{
					id: req.params.id
				}}).then(() => {
					socketController.socket_delete_server(req.params.id);
					res.status(200).json({success: true, message: '성공적으로 반영되었습니다.'});
				});
			}).catch((err) => {
				console.log(err);
				res.status(200).json({success : false, error: '적용 도중 오류가 발생했습니다.'});
			});
	} else {
		res.status(404).send({success: false, error: '적용할 서버 데이터가 없습니다.'});
	}
};