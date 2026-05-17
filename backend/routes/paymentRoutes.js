import express from 'express';
import {
    getMyPaymentTransactions,
    listPaymentTransactions,
    submitPaymentUtr,
    verifyPaymentUtr,
} from '../controllers/paymentController.js';
import { isAdmin } from '../middleware/adminAuth.js';
import { verifyToken } from '../middleware/auth.js';
import { createRateLimiter } from '../middleware/rateLimit.js';

import { generateInvoicePDF } from '../controllers/invoiceController.js';

const router = express.Router();

const paymentSubmissionLimiter = createRateLimiter({
    keyPrefix: 'payments-submit-utr',
    limit: 5,
    windowMs: 60 * 60 * 1000,
    message: 'Too many UTR submissions. Please wait before trying again.',
    getKey: (req) => req.user?._id?.toString() || req.ip,
});

router.post('/submit-utr', verifyToken, paymentSubmissionLimiter, submitPaymentUtr);
router.get('/mine', verifyToken, getMyPaymentTransactions);
router.get('/admin/transactions', isAdmin, listPaymentTransactions);
router.post('/verify-utr', isAdmin, verifyPaymentUtr);
router.get('/:transactionId/invoice', verifyToken, generateInvoicePDF);
router.get('/invoice/:transactionId/download', verifyToken, generateInvoicePDF);

export default router;
