import dns from 'dns';
import nodemailer from 'nodemailer';

dns.setDefaultResultOrder('ipv4first');

const SMTP_CONNECTION_ERRORS = ['ETIMEDOUT', 'ESOCKET', 'ECONNECTION', 'ECONNREFUSED', 'ENETUNREACH'];

let smtpTransporter = null;

const isProductionEnv = () => process.env.NODE_ENV === 'production';

const stripWrappingQuotes = (value) => {
    const trimmed = String(value || '').trim();

    if (
        (trimmed.startsWith('"') && trimmed.endsWith('"'))
        || (trimmed.startsWith('\'') && trimmed.endsWith('\''))
    ) {
        return trimmed.slice(1, -1).trim();
    }

    return trimmed;
};

const maskEmail = (value) => {
    if (typeof value !== 'string' || !value.includes('@')) return 'missing';
    const [local, domain] = value.split('@');
    return `${local.slice(0, 2)}***@${domain}`;
};

const parseBooleanEnv = (value, fallback = false) => {
    if (typeof value !== 'string') return fallback;
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
    return fallback;
};

const resolveMailConfig = () => {
    const host = stripWrappingQuotes(process.env.EMAIL_HOST || '');
    const port = Number(stripWrappingQuotes(process.env.EMAIL_PORT || '587'));
    const secure = parseBooleanEnv(process.env.EMAIL_SECURE, port === 465);
    const user = stripWrappingQuotes(process.env.EMAIL_USER || '');
    const pass = stripWrappingQuotes(process.env.EMAIL_PASS || '');
    const fromAddress = stripWrappingQuotes(process.env.EMAIL_FROM || user);

    return {
        host,
        port,
        secure,
        user,
        pass,
        fromAddress,
    };
};

const validateMailConfig = (config = resolveMailConfig(), { allowDebugFallback = !isProductionEnv() } = {}) => {
    const errors = [];

    if (!config.host) errors.push('EMAIL_HOST is required');
    if (!Number.isFinite(config.port) || config.port <= 0) errors.push('EMAIL_PORT must be a valid positive number');
    if (!config.user) errors.push('EMAIL_USER is required');
    if (!config.pass) errors.push('EMAIL_PASS is required');
    if (!config.fromAddress) errors.push('EMAIL_FROM is required');

    if (config.fromAddress && !/^[^<>\r\n]+<[^<>\s@]+@[^<>\s@]+>$|^[^<>\s@]+@[^<>\s@]+$/.test(config.fromAddress)) {
        errors.push('EMAIL_FROM must use `email@example.com` or `Name <email@example.com>` format');
    }

    if (errors.length > 0 && !allowDebugFallback) {
        throw Object.assign(new Error(errors.join('; ')), {
            code: 'MAIL_CONFIG_INVALID',
            status: 500,
            retryable: false,
        });
    }

    return {
        valid: errors.length === 0,
        errors,
        config,
    };
};

const createSmtpTransporter = () => {
    const { config } = validateMailConfig(resolveMailConfig(), { allowDebugFallback: false });

    return nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: {
            user: config.user,
            pass: config.pass,
        },
        connectionTimeout: 10_000,
        greetingTimeout: 10_000,
        socketTimeout: 15_000,
        requireTLS: !config.secure,
        tls: {
            minVersion: 'TLSv1.2',
        },
    });
};

const getTransporter = () => {
    if (!smtpTransporter) {
        smtpTransporter = createSmtpTransporter();
    }

    return smtpTransporter;
};

const buildMailResult = (result = {}) => ({
    delivered: Boolean(result.delivered),
    messageId: result.messageId || null,
    retryable: result.retryable !== false,
    code: result.code || null,
    ...(result.debug ? { debug: true } : {}),
});

const sendMail = async ({ to, subject, html, label }) => {
    const diagnostics = validateMailConfig(resolveMailConfig(), { allowDebugFallback: !isProductionEnv() });

    if (!diagnostics.valid) {
        if (isProductionEnv()) {
            throw Object.assign(new Error(diagnostics.errors.join('; ')), {
                code: 'MAIL_CONFIG_INVALID',
                status: 500,
                retryable: false,
            });
        }

        console.warn('[MAIL:DEV] SMTP not fully configured. Returning debug delivery result.', {
            label,
            errors: diagnostics.errors,
        });

        return buildMailResult({
            delivered: false,
            debug: true,
            retryable: false,
            code: 'MAIL_CONFIG_INVALID',
        });
    }

    const transporter = getTransporter();
    const from = diagnostics.config.fromAddress;

    console.log(`[MAIL:SMTP] Sending ${label} to ${maskEmail(to)} from ${from}`);

    try {
        const info = await transporter.sendMail({
            from,
            to,
            subject,
            html,
        });

        console.log('[MAIL:SMTP] Delivery succeeded', {
            label,
            messageId: info.messageId,
            response: info.response || null,
        });

        return buildMailResult({
            delivered: true,
            messageId: info.messageId,
            retryable: true,
        });
    } catch (error) {
        console.error('[MAIL:SMTP] Delivery failed', {
            label,
            code: error.code,
            message: error.message,
        });

        if (SMTP_CONNECTION_ERRORS.includes(error.code)) {
            smtpTransporter = null;
        }

        throw Object.assign(new Error('Email delivery failed'), {
            code: error.code || 'SMTP_SEND_FAILED',
            status: 502,
            retryable: true,
            cause: error,
        });
    }
};

export const verifySmtpConnection = async () => {
    const diagnostics = getSmtpDiagnostics();
    console.log('[MAIL] SMTP diagnostics', diagnostics);

    if (!diagnostics.configured) {
        if (isProductionEnv()) {
            throw Object.assign(new Error('SMTP mail configuration is incomplete'), {
                code: 'MAIL_CONFIG_INVALID',
                status: 500,
                retryable: false,
            });
        }

        console.warn('[MAIL] SMTP not fully configured. Mail delivery will stay in debug mode.');
        return false;
    }

    try {
        await getTransporter().verify();
        console.log('[MAIL] SMTP verification succeeded.');
        return true;
    } catch (error) {
        console.error('[MAIL] SMTP verification failed', {
            code: error.code,
            message: error.message,
        });
        smtpTransporter = null;

        if (isProductionEnv()) {
            throw Object.assign(new Error('SMTP verification failed during startup'), {
                code: error.code || 'SMTP_VERIFY_FAILED',
                status: 500,
                retryable: false,
                cause: error,
            });
        }

        return false;
    }
};

export const getSmtpDiagnostics = () => {
    const { valid, errors, config } = validateMailConfig(resolveMailConfig(), { allowDebugFallback: true });

    return {
        configured: valid,
        errors,
        host: config.host || null,
        port: config.port || null,
        secure: config.secure,
        senderConfigured: Boolean(config.fromAddress),
        fromAddress: config.fromAddress || null,
    };
};

const brandedHtml = ({ heading, subtitle, bodyHtml }) => `
<div style="font-family:Arial,sans-serif;line-height:1.6;color:#e5e7eb;background:#0f1117;padding:24px">
  <div style="max-width:560px;margin:0 auto;background:#121212;border:1px solid #1f2937;border-radius:20px;overflow:hidden">
    <div style="padding:28px;border-bottom:1px solid #1f2937;background:linear-gradient(135deg,#0f172a,#121212)">
      <p style="margin:0 0 8px;color:#4ade80;font-size:12px;letter-spacing:.18em;font-weight:700;text-transform:uppercase">${subtitle}</p>
      <h1 style="margin:0;font-size:24px;color:#f9fafb">${heading}</h1>
    </div>
    <div style="padding:28px">${bodyHtml}</div>
  </div>
</div>`;

const otpBlock = (otp, expiresInMinutes) => `
<div style="margin:24px 0;padding:18px;border-radius:16px;border:1px solid #1f2937;background:#0b0d12;text-align:center">
  <p style="margin:0 0 10px;color:#9ca3af;font-size:12px;text-transform:uppercase;letter-spacing:.16em">Verification Code</p>
  <p style="margin:0;font-size:32px;letter-spacing:8px;font-weight:700;color:#4ade80">${otp}</p>
</div>
<p style="color:#d1d5db">This code expires in ${expiresInMinutes} minutes.</p>`;

export const sendAccountVerificationEmail = ({ to, otp, name, expiresInMinutes }) =>
    sendMail({
        to,
        subject: 'Verify your CodeArena 1v1 account',
        label: 'Account Verification',
        html: brandedHtml({
            heading: 'Welcome to the Arena!',
            subtitle: 'CodeArena 1v1 Verification',
            bodyHtml: `
                <p style="margin-top:0;color:#d1d5db">Hi ${name || 'there'},</p>
                <p style="color:#d1d5db">Thank you for joining CodeArena 1v1. Verify your email address using the code below:</p>
                ${otpBlock(otp, expiresInMinutes)}
                <p style="color:#d1d5db">If you did not create an account, you can safely ignore this email.</p>`,
        }),
    });

export const sendSettingsOtpEmail = ({ to, otp, name, expiresInMinutes }) =>
    sendMail({
        to,
        subject: 'CodeArena 1v1 password change verification code',
        label: 'Settings OTP',
        html: brandedHtml({
            heading: 'Verify your password update',
            subtitle: 'CodeArena 1v1 Security',
            bodyHtml: `
                <p style="margin-top:0;color:#d1d5db">Hi ${name || 'there'},</p>
                <p style="color:#d1d5db">We received a request to change your account password. Use the code below to continue:</p>
                ${otpBlock(otp, expiresInMinutes)}
                <p style="color:#d1d5db">If you did not request this, you can ignore this email and your password will remain unchanged.</p>`,
        }),
    });

export const sendPasswordResetOtpEmail = ({ to, otp, name, expiresInMinutes }) =>
    sendMail({
        to,
        subject: 'CodeArena 1v1 password reset code',
        label: 'Password Reset',
        html: brandedHtml({
            heading: 'Reset your password',
            subtitle: 'CodeArena 1v1 Recovery',
            bodyHtml: `
                <p style="margin-top:0;color:#d1d5db">Hi ${name || 'there'},</p>
                <p style="color:#d1d5db">Use the code below to continue resetting your CodeArena 1v1 password:</p>
                ${otpBlock(otp, expiresInMinutes)}
                <p style="color:#d1d5db">If you did not request this, you can ignore this email.</p>`,
        }),
    });

export const sendPaymentSubmissionEmail = ({ to, name, planName, amount, utrNumber }) =>
    sendMail({
        to,
        subject: `CodeArena 1v1 payment received for ${planName}`,
        label: 'Payment Submission',
        html: `
            <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
                <p>Hi ${name || 'there'},</p>
                <p>We received your manual UPI payment request for <strong>${planName}</strong>.</p>
                <p>Amount: <strong>Rs. ${amount}</strong></p>
                <p>UTR: <strong>${utrNumber}</strong></p>
                <p>Our team is verifying the payment now. You will receive another email once it is approved or rejected.</p>
            </div>`,
    });

export const sendPaymentApprovedEmail = ({ to, name, planName, amount }) =>
    sendMail({
        to,
        subject: `Welcome to CodeArena 1v1 ${planName}`,
        label: 'Payment Approved',
        html: `
            <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
                <p>Hi ${name || 'there'},</p>
                <p>Your payment for <strong>${planName}</strong> has been approved.</p>
                <p>Amount received: <strong>Rs. ${amount}</strong></p>
                <p>Welcome to Pro. Your premium access is now active in CodeArena 1v1.</p>
            </div>`,
    });

export const sendPaymentRejectedEmail = ({ to, name, planName, amount, adminNotes }) => {
    const notesBlock = adminNotes
        ? `<p>Reviewer note: <strong>${adminNotes}</strong></p>`
        : '<p>Please check the UTR with your bank or payment app and try again.</p>';

    return sendMail({
        to,
        subject: 'CodeArena 1v1 payment could not be verified',
        label: 'Payment Rejected',
        html: `
            <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
                <p>Hi ${name || 'there'},</p>
                <p>We could not verify your payment request for <strong>${planName}</strong>.</p>
                <p>Amount expected: <strong>Rs. ${amount}</strong></p>
                ${notesBlock}
                <p>You can submit a fresh payment request with the correct 12-digit UTR once the issue is resolved.</p>
            </div>`,
    });
};
