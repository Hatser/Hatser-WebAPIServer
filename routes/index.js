var express = require('express');
var router = express.Router();

// 라우트 불러오기, 인증이 필요없는 유저 기능
router.use('/user', require('./user/user')); // user경로로 들어오는 접근을 해당 router에게 위임, 기본 경로...
// 라우트 불러오기, 인증이 필요한 유저 기능
router.use('/auth', require('./user/auth'));

router.use('/admin', require('./user/admin'));

router.use('/server', require('./server/server'));

router.use('/web/admin', require('./web/admin'));

router.use('/motd', require('./motd-redirector/motd-redirector'));

// 최상위 인덱스 화면
/*
app.use((req, res, next) => {
  if (!req.originalUrl.includes('/static/', 0)) {
    res.sendFile(`${__dirname}/app/index.html`);
  } else {
    next();
  }
});*/

module.exports = router;
