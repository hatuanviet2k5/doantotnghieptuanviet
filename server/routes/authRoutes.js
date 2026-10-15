const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authenticate = require('../middlewares/authMiddleware');

router.post('/login', authController.login);
router.post('/register', authController.register);
router.get('/profile', authenticate, authController.getProfile);

module.exports = router;
