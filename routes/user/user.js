let express = require('express')
let router = express.Router();

let userController = require('../../controllers/user');

router.get('/logout', userController.user_sign_out);

router.get('/search/:id', userController.user_search_user);

module.exports = router;