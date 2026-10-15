const express = require('express');
const router = express.Router();
const bookController = require('../controllers/bookController');
const authenticate = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/rbacMiddleware');
const upload = require('../middlewares/uploadMiddleware');

router.get('/', bookController.getAll);
router.get('/:id', bookController.getById);

router.post('/', authenticate, authorize('ADMIN'), upload.single('cover'), bookController.create);
router.put('/:id', authenticate, authorize('ADMIN'), upload.single('cover'), bookController.update);
router.delete('/:id', authenticate, authorize('ADMIN'), bookController.delete);

module.exports = router;
