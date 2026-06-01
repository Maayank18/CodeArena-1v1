import mongoose from 'mongoose';

const paymentTransactionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    planId: {
        type: String,
        required: true,
        enum: ['plus', 'pro', 'premium'],
        trim: true,
    },
    planName: {
        type: String,
        required: true,
        enum: ['PLUS', 'PRO', 'PREMIUM'],
        trim: true,
    },
    amount: {
        type: Number,
        required: true,
        min: 1,
    },
    utrNumber: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        match: /^\d{12}$/,
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
        index: true,
    },
    adminNotes: {
        type: String,
        default: '',
        trim: true,
        maxlength: 500,
    },
    reviewedAt: {
        type: Date,
        default: null,
    },
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
}, {
    timestamps: true,
});

paymentTransactionSchema.index({ status: 1, createdAt: -1 });
paymentTransactionSchema.index({ userId: 1, status: 1, createdAt: -1 });

const PaymentTransaction = mongoose.model('PaymentTransaction', paymentTransactionSchema);

export const ensurePaymentTransactionIndexes = async () => {
    try {
        await PaymentTransaction.createCollection();
    } catch (error) {
        const alreadyExists = error?.codeName === 'NamespaceExists' || error?.code === 48;
        if (!alreadyExists) {
            throw error;
        }
    }

    await PaymentTransaction.createIndexes();
};

export default PaymentTransaction;

// Version-2.0