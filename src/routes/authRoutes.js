const express = require('express');
const router  = express.Router();
const protect = require('../middlewares/authMiddleware');
const { register, login, refresh, logout, logoutAll } = require('../controllers/authController');

router.post('/register',   register);
router.post('/login',      login);
router.post('/refresh',    refresh);
router.post('/logout',     logout);       // no protect — works even with expired AT
router.post('/logout-all', protect, logoutAll); // protect required to identify the user

module.exports = router;
