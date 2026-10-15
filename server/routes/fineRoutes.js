const express = require('express');
const router = express.Router();
const fineController = require('../controllers/fineController');
const authenticate = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/rbacMiddleware');

router.get('/', authenticate, fineController.getAll);
router.post('/pay', authenticate, authorize('ADMIN', 'LIBRARIAN'), fineController.payFine);
router.get('/user/:userId', authenticate, fineController.getByUser);

module.exports = router;
