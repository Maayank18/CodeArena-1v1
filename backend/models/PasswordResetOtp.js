import mongoose from 'mongoose';

const passwordResetOtpSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
        index: true,
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
    },
    otpHash: {
        type: String,
        required: true,
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expires: 0 },
    },
    resendAvailableAt: {
        type: Date,
        required: true,
    },
    attemptCount: {
        type: Number,
        default: 0,
    },
    verifiedAt: {
        type: Date,
        default: null,
    },
    consumedAt: {
        type: Date,
        default: null,
    },
}, {
    timestamps: true,
});

export default mongoose.model('PasswordResetOtp', passwordResetOtpSchema);

// Version-2.0