const express = require('express');
const router = express.Router();
const shelfController = require('../controllers/shelfController');
const authenticate = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/rbacMiddleware');

// Shelf routes
router.get('/shelves', shelfController.getAllShelves);
router.get('/shelves/:id', shelfController.getShelfById);
router.post('/shelves', authenticate, authorize('ADMIN', 'LIBRARIAN'), shelfController.createShelf);
router.put('/shelves/:id', authenticate, authorize('ADMIN', 'LIBRARIAN'), shelfController.updateShelf);
router.delete('/shelves/:id', authenticate, authorize('ADMIN'), shelfController.deleteShelf);

// Book copies routes
router.get('/copies', shelfController.getAllCopies);
router.post('/shelves/:shelfId/copies', authenticate, authorize('ADMIN', 'LIBRARIAN'), shelfController.addCopy);
router.put('/copies/:id', authenticate, authorize('ADMIN', 'LIBRARIAN'), shelfController.updateCopyStatus);
router.delete('/copies/:id', authenticate, authorize('ADMIN'), shelfController.deleteCopy);

module.exports = router;
