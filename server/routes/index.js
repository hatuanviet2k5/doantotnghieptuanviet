const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const bookRoutes = require('./bookRoutes');
const categoryRoutes = require('./categoryRoutes');
const authorRoutes = require('./authorRoutes');
const shelfRoutes = require('./shelfRoutes');
const ticketRoutes = require('./ticketRoutes');
const readerCardRoutes = require('./readerCardRoutes');
const fineRoutes = require('./fineRoutes');
const reportRoutes = require('./reportRoutes');
const auditLogRoutes = require('./auditLogRoutes');
const userRoutes = require('./userRoutes');

router.use('/auth', authRoutes);
router.use('/books', bookRoutes);
router.use('/categories', categoryRoutes);
router.use('/authors', authorRoutes);
router.use('/', shelfRoutes); // handles /shelves and /copies
router.use('/tickets', ticketRoutes);
router.use('/reader-cards', readerCardRoutes);
router.use('/fines', fineRoutes);
router.use('/reports', reportRoutes);
router.use('/audit-logs', auditLogRoutes);
router.use('/users', userRoutes);

module.exports = router;
