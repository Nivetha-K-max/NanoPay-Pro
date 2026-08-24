import express from 'express';
import { getTransactions, createTransaction, getTransactionById, getSpendingSeries, getCategoryBreakdown } from '../controllers/transactionController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', getTransactions);
router.post('/', createTransaction);
router.get('/:id', getTransactionById);

// Analytics (dashboard)
router.get('/analytics/spending', getSpendingSeries);
router.get('/analytics/category', getCategoryBreakdown);

export default router;

