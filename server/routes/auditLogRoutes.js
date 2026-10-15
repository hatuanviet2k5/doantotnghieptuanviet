const express = require('express');
const router = express.Router();
const auditLogController = require('../controllers/auditLogController');
const authenticate = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/rbacMiddleware');

router.get('/', authenticate, authorize('ADMIN'), auditLogController.getAll);

module.exports = router;
