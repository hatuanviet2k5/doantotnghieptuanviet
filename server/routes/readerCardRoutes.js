const express = require('express');
const router = express.Router();
const readerCardController = require('../controllers/readerCardController');
const authenticate = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/rbacMiddleware');

router.get('/', authenticate, authorize('ADMIN', 'LIBRARIAN'), readerCardController.getAll);
router.get('/:id', authenticate, authorize('ADMIN', 'LIBRARIAN'), readerCardController.getById);
router.post('/', authenticate, authorize('ADMIN', 'LIBRARIAN'), readerCardController.create);
router.put('/:id', authenticate, authorize('ADMIN', 'LIBRARIAN'), readerCardController.update);
router.put('/:id/status', authenticate, authorize('ADMIN', 'LIBRARIAN'), readerCardController.updateStatus);

module.exports = router;
