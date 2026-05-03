import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import { createRateLimiter } from '../middleware/rateLimit.js';
import {
    getSettingsProfile,
    requestSettingsOtp,
    updateProfileSettings,
    verifySettingsOtp,
} from '../controllers/settingsController.js';

const router = express.Router();

const settingsOtpRateLimiter = createRateLimiter({
    keyPrefix: 'settings-otp',
    limit: 3,
    windowMs: 15 * 60 * 1000,
    message: 'Too many OTP requests. Please wait 15 minutes before trying again.',
});

router.use(verifyToken);

router.get('/profile', getSettingsProfile);
router.put('/profile', updateProfileSettings);
router.post('/request-otp', settingsOtpRateLimiter, requestSettingsOtp);
router.post('/verify-otp', verifySettingsOtp);

export default router;
