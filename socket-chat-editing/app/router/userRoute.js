const express = require('express');
const userController = require('../controller/userController');
const { isLogin, isLogout } = require('../middleware/auth');
const router = express.Router();

router.get('/',userController.home)
router.get('/register',isLogout,userController.register)
router.post('/create/register',userController.create)
router.get('/login',isLogout,userController.loginview)
router.post('/login/create',userController.loginCreate)
router.get('/logout',userController.logout)
router.get('/dashboard',isLogin,userController.dashboard)
router.get('/get-chats',isLogin,userController.getChats)

router.post('/save-chat',userController.saveChat)


module.exports = router;