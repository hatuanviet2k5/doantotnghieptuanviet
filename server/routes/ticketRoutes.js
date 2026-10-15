const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const authenticate = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/rbacMiddleware');

router.post('/hold', authenticate, ticketController.holdBook);
router.post('/verify-qr', authenticate, authorize('ADMIN', 'LIBRARIAN'), ticketController.verifyQr);
router.post('/return', authenticate, authorize('ADMIN', 'LIBRARIAN'), ticketController.returnBook);
router.post('/renew/:id', authenticate, ticketController.renewTicket);
router.post('/cancel/:id', authenticate, ticketController.cancelTicket);

router.get('/', authenticate, ticketController.getAll);
router.get('/:id', authenticate, ticketController.getById);

module.exports = router;
