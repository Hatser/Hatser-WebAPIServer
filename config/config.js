let path = require('path');
let appDir = path.dirname(require.main.filename || process.mainModule.filename);
let config = {};

/** 인증 설정 **/
// 발급받은 STEAM WEB API Key
config.steam_api_key = 'A4B8B39D1F9619BB64D71F7D909CAC6E';

// 세션 이름
//config.session_name = 'store_steam_acc_session';
//config.session_secret_key = 'store_steam_acc_session_secret_dat_udntknow';
// 토큰 암호화 키
config.jwt_token_secret_key = 'store_steam_acc_jwt_token_secret_key_dat_uneverknow';

// 로그인 토큰의 유지기간
config.login_token_age = 60 * 60 * 24;
/** 로그인 세션을 언제 한 번 갱신할 것인지? (밀리 초 단위)
 * 이 내용은 좌측 사이드바의 유저 정보 갱신과 관련이 있습니다. **/
config.login_session_validation_period = 300*1000;


/** Path 설정 **/

// 서버의 루트 폴더를 가리키도록 설정합니다.
config.root_path = path.join(appDir, '../');

// 서버의 뷰 폴더의 위치를 가리킵니다.
config.view_path = path.join(config.root_path, 'views');

// 서버의 정적 파일 폴더를 가리킵니다.
config.public_contents_path = path.join(config.root_path, '/public');

// 뷰폴더 내의 템플릿 폴더명과, 사용할 템플릿의 폴더명을 기록합니다.
config.view_template_path = path.join('templates', 'vue-page');

// 기본적으로 사용할 뷰 파일을 기록합니다.
config.default_view_file = 'index';

/** DB 설정 **/
config.db_hostname = '127.0.0.1';
config.db_port = 3306;
config.db_username = 'root';
config.db_password = 'root';
config.db_default_database = 'sm_webclient';

// nginx 등의 프록시 패스 기능을 서버 앞단에 두고서 운용한다면, 이곳에 포트를 적어주세요 (80)
// 0일 경우 지원을 비활성화합니다.
config.proxy_server_port = 3000;
// 서버 도메인 명이 있다면 이곳에 적어주세요
// '' (공란)일 경우 지원을 비활성화합니다.
config.server_domain_name = 'localhost';

module.exports = config;