let express = require('express'); // express 로드 (함수형태)
let router = express.Router();
let serverController = require('../../controllers/server');
let userController = require('../../controllers/user/web-admin.controller');

// 서버 목록을 JSON으로 나타낸다.
router.get( '/list', 
	userController.user_sessionize_web_permissions,
	serverController.server_page);

// 서버 삭제 페이지에 필요한 내용을 보낸다.
router.get('/form/delete/:id', 
	userController.user_sessionize_web_permissions, userController.user_check_web_permissions('WEB_ADM_PERM_GAME_SERVER'),
	serverController.server_delete_page);

// 서버 수정 페이지에 필요한 내용을 보낸다.
router.get('/form/edit/:id',
	userController.user_sessionize_web_permissions, userController.user_check_web_permissions('WEB_ADM_PERM_GAME_SERVER'),
	serverController.server_edit_page);

router.post('/register',
	userController.user_sessionize_web_permissions, userController.user_check_web_permissions('WEB_ADM_PERM_GAME_SERVER'),
	serverController.server_receive_uploaded_file,
	serverController.server_register);

router.post('/delete/:id',
	userController.user_sessionize_web_permissions, userController.user_check_web_permissions('WEB_ADM_PERM_GAME_SERVER'),
	serverController.server_delete);

router.post('/edit/:id',
	userController.user_sessionize_web_permissions, userController.user_check_web_permissions('WEB_ADM_PERM_GAME_SERVER'),
	serverController.server_receive_uploaded_file,
	serverController.server_edit);

router.get('/info/:id',
	serverController.server_detail_info);

//router.get('/info/:id', serverController.server_cache(180), serverController.server_info);

module.exports = router;

