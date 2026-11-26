const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authenticate = require('../middlewares/authMiddleware');
const { authLimiter } = require('../middlewares/securityMiddleware');

router.post('/login', authLimiter, authController.login);
router.post('/register', authLimiter, authController.register);
router.get('/profile', authenticate, authController.getProfile);
router.put('/profile', authenticate, authController.updateProfile);
router.post('/change-password', authenticate, authController.changePassword);

module.exports = router;
