import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema({
    invoiceId: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    transactionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PaymentTransaction',
        required: true,
        unique: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    planName: {
        type: String,
        required: true,
    },
    issuedAt: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});

const Invoice = mongoose.model('Invoice', invoiceSchema);

export default Invoice;

// Version-2.0