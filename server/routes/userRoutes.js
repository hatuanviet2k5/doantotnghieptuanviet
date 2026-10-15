const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authenticate = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/rbacMiddleware');

router.get('/', authenticate, authorize('ADMIN'), userController.getAll);
router.get('/:id', authenticate, authorize('ADMIN'), userController.getById);
router.post('/', authenticate, authorize('ADMIN'), userController.create);
router.put('/:id', authenticate, authorize('ADMIN'), userController.update);
router.put('/:id/status', authenticate, authorize('ADMIN'), userController.updateStatus);

module.exports = router;
