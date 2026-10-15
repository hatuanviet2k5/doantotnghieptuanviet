const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const authenticate = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/rbacMiddleware');

router.get('/', categoryController.getAll);
router.get('/:id', categoryController.getById);

router.post('/', authenticate, authorize('ADMIN'), categoryController.create);
router.put('/:id', authenticate, authorize('ADMIN'), categoryController.update);
router.delete('/:id', authenticate, authorize('ADMIN'), categoryController.delete);

module.exports = router;
