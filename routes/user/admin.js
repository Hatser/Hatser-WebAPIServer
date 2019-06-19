let express = require('express'); // express 로드 (함수형태)
let router = express.Router();
let userController = require('../../controllers/user');

/**
 * userController.user_ensure_authenticated 사용 시, 처음부터 그 주소에 접근하면
 * 로그인이 되지않은 상태일 때 페이지 템플릿이 뜨지 않고 데이터만 뜨는데,
 * 그 이유는 userController.user_ensure_authenticated 메서드에서 처음부터 차단당하기 때문에
 * 템플릿에 띄우는 시도조차 하지않기 때문이다...
 */

router.get('/list', userController.user_server_admin_page);

router.post('/user/register/:id', userController.user_sessionize_web_permissions, userController.user_check_web_permissions('WEB_ADM_PERM_GAME_SERVER_ADMIN'), userController.user_admin_register);
router.post('/user/delete/:id', userController.user_sessionize_web_permissions, userController.user_check_web_permissions('WEB_ADM_PERM_GAME_SERVER_ADMIN'), userController.user_admin_delete);

module.exports = router;