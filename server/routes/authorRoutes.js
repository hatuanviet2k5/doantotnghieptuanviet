const express = require('express');
const router = express.Router();
const authorController = require('../controllers/authorController');
const authenticate = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/rbacMiddleware');

router.get('/', authorController.getAll);
router.get('/:id', authorController.getById);

router.post('/', authenticate, authorize('ADMIN'), authorController.create);
router.put('/:id', authenticate, authorize('ADMIN'), authorController.update);
router.delete('/:id', authenticate, authorize('ADMIN'), authorController.delete);

module.exports = router;
