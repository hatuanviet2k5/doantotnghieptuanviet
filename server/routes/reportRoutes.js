const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const authenticate = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/rbacMiddleware');

router.get('/statistics', authenticate, authorize('ADMIN', 'LIBRARIAN'), reportController.getStatistics);
router.get('/overdue', authenticate, authorize('ADMIN', 'LIBRARIAN'), reportController.getOverdueTickets);
router.get('/export/excel', authenticate, authorize('ADMIN', 'LIBRARIAN'), reportController.exportExcel);
router.get('/export/pdf', authenticate, authorize('ADMIN', 'LIBRARIAN'), reportController.exportPdf);

module.exports = router;
