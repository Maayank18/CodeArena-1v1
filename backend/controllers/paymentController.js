import mongoose from 'mongoose';
import PaymentTransaction from '../models/PaymentTransaction.js';
import User from '../models/User.js';
import {
    sendPaymentApprovedEmail,
    sendPaymentRejectedEmail,
    sendPaymentSubmissionEmail,
} from '../services/authEmailService.js';

const UTR_REGEX = /^\d{12}$/;
const PLAN_CATALOG = {
    plus: { planId: 'plus', planName: 'PLUS', baseAmount: 149 },
    pro: { planId: 'pro', planName: 'PRO', baseAmount: 249 },
    premium: { planId: 'premium', planName: 'PREMIUM', baseAmount: 349 },
};

const getPlanDetails = (planId) => {
    const normalizedPlanId = typeof planId === 'string' ? planId.trim().toLowerCase() : '';
    const plan = PLAN_CATALOG[normalizedPlanId];

    if (!plan) {
        return null;
    }

    const gst = 0;

    return {
        ...plan,
        gst,
        amount: plan.baseAmount,
    };
};

const buildTransactionPayload = (transaction) => ({
    id: transaction._id,
    userId: transaction.userId,
    planId: transaction.planId,
    planName: transaction.planName,
    amount: transaction.amount,
    utrNumber: transaction.utrNumber,
    status: transaction.status,
    adminNotes: transaction.adminNotes,
    reviewedAt: transaction.reviewedAt,
    reviewedBy: transaction.reviewedBy,
    createdAt: transaction.createdAt,
    updatedAt: transaction.updatedAt,
});

export const submitPaymentUtr = async (req, res) => {
    try {
        const { planId, utrNumber } = req.body;
        const normalizedUtr = typeof utrNumber === 'string' ? utrNumber.trim() : '';
        const plan = getPlanDetails(planId);

        if (!plan) {
            return res.status(400).json({
                success: false,
                message: 'Invalid plan selected',
            });
        }

        if (!UTR_REGEX.test(normalizedUtr)) {
            return res.status(400).json({
                success: false,
                message: 'UTR must be exactly 12 numeric digits',
            });
        }

        const user = await User.findById(req.user?._id)
            .select('_id username fullName email emailVerified phoneVerified')
            .lean();

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found for this session',
            });
        }

        if (!user.emailVerified || !user.phoneVerified) {
            return res.status(403).json({
                success: false,
                message: 'Please verify your email and phone number in settings before purchasing a plan',
            });
        }

        const existingPendingRequest = await PaymentTransaction.findOne({
            userId: user._id,
            status: 'pending',
        })
            .select('_id planId createdAt')
            .lean();

        if (existingPendingRequest) {
            return res.status(409).json({
                success: false,
                message: 'You already have a payment request pending review',
                transaction: {
                    id: existingPendingRequest._id,
                    planId: existingPendingRequest.planId,
                    createdAt: existingPendingRequest.createdAt,
                },
            });
        }

        let transaction;

        try {
            transaction = await PaymentTransaction.create({
                userId: user._id,
                planId: plan.planId,
                planName: plan.planName,
                amount: plan.amount,
                utrNumber: normalizedUtr,
            });
        } catch (error) {
            if (error?.code === 11000) {
                return res.status(409).json({
                    success: false,
                    message: 'This UTR has already been submitted',
                });
            }

            throw error;
        }

        let emailDelivered = false;

        try {
            const emailResult = await sendPaymentSubmissionEmail({
                to: user.email,
                name: user.fullName || user.username,
                planName: plan.planName,
                amount: plan.amount,
                utrNumber: normalizedUtr,
            });
            emailDelivered = Boolean(emailResult?.delivered);
        } catch (emailError) {
            console.error('[PAYMENTS] Submission email failed:', emailError.message);
        }

        return res.status(201).json({
            success: true,
            message: 'Payment request submitted and queued for verification',
            transaction: buildTransactionPayload(transaction),
            emailNotification: {
                delivered: emailDelivered,
            },
        });
    } catch (error) {
        console.error('[PAYMENTS] submitPaymentUtr error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to submit payment request',
        });
    }
};

export const verifyPaymentUtr = async (req, res) => {
    const { transactionId, decision, adminNotes } = req.body;
    const normalizedDecision = typeof decision === 'string' ? decision.trim().toLowerCase() : '';
    const sanitizedNotes = typeof adminNotes === 'string' ? adminNotes.trim().slice(0, 500) : '';

    if (!mongoose.isValidObjectId(transactionId)) {
        return res.status(400).json({
            success: false,
            message: 'A valid transactionId is required',
        });
    }

    if (!['approved', 'rejected'].includes(normalizedDecision)) {
        return res.status(400).json({
            success: false,
            message: 'Decision must be either approved or rejected',
        });
    }

    const session = await mongoose.startSession();
    let transactionPayload = null;
    let emailPayload = null;

    try {
        await session.withTransaction(async () => {
            const transaction = await PaymentTransaction.findOne({
                _id: transactionId,
                status: 'pending',
            }).session(session);

            if (!transaction) {
                const notFoundError = new Error('Pending payment request not found');
                notFoundError.statusCode = 404;
                throw notFoundError;
            }

            const user = await User.findById(transaction.userId).session(session);
            if (!user) {
                const userNotFoundError = new Error('Linked user account not found');
                userNotFoundError.statusCode = 404;
                throw userNotFoundError;
            }

            const reviewedAt = new Date();

            transaction.status = normalizedDecision;
            transaction.adminNotes = sanitizedNotes;
            transaction.reviewedAt = reviewedAt;
            transaction.reviewedBy = req.user._id;
            await transaction.save({ session });

            if (normalizedDecision === 'approved') {
                user.isPro = true;
                user.planId = transaction.planId;
                user.subscriptionPlan = transaction.planId;
                user.proActivatedAt = reviewedAt;
                user.subscriptionExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                await user.save({ session });
            }

            transactionPayload = buildTransactionPayload(transaction);
            emailPayload = {
                to: user.email,
                name: user.fullName || user.username,
                planName: transaction.planName,
                amount: transaction.amount,
                adminNotes: sanitizedNotes,
            };
        });
    } catch (error) {
        const isTransactionUnsupported = typeof error?.message === 'string'
            && error.message.includes('Transaction numbers are only allowed');

        if (isTransactionUnsupported) {
            return res.status(503).json({
                success: false,
                message: 'MongoDB transactions require a replica set or sharded cluster',
            });
        }

        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.statusCode ? error.message : 'Failed to verify payment request',
        });
    } finally {
        await session.endSession();
    }

    let emailDelivered = false;

    try {
        const emailResult = normalizedDecision === 'approved'
            ? await sendPaymentApprovedEmail(emailPayload)
            : await sendPaymentRejectedEmail(emailPayload);

        emailDelivered = Boolean(emailResult?.delivered);
    } catch (emailError) {
        console.error('[PAYMENTS] Review email failed:', emailError.message);
    }

    return res.json({
        success: true,
        message: normalizedDecision === 'approved'
            ? 'Payment approved and membership activated'
            : 'Payment rejected successfully',
        transaction: transactionPayload,
        emailNotification: {
            delivered: emailDelivered,
        },
    });
};

export const listPaymentTransactions = async (req, res) => {
    try {
        const normalizedStatus = typeof req.query.status === 'string'
            ? req.query.status.trim().toLowerCase()
            : 'pending';

        const filter = ['pending', 'approved', 'rejected'].includes(normalizedStatus)
            ? { status: normalizedStatus }
            : {};

        const transactions = await PaymentTransaction.find(filter)
            .populate('userId', 'username fullName email')
            .populate('reviewedBy', 'username email')
            .sort({ createdAt: -1 })
            .limit(100)
            .lean();

        return res.json({
            success: true,
            transactions,
        });
    } catch (error) {
        console.error('[PAYMENTS] listPaymentTransactions error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to load payment transactions',
        });
    }
};

export const getMyPaymentTransactions = async (req, res) => {
    try {
        const transactions = await PaymentTransaction.find({ userId: req.user?._id })
            .sort({ createdAt: -1 })
            .limit(20)
            .lean();

        return res.json({
            success: true,
            transactions,
        });
    } catch (error) {
        console.error('[PAYMENTS] getMyPaymentTransactions error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to load your payment transactions',
        });
    }
};
