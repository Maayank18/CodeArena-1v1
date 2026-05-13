import nodemailer from 'nodemailer';

let cachedTransporter = null;
let smtpDiagnostics = {
    configured: false,
    verified: false,
    provider: null,
    host: null,
    port: null,
    username: null,
    from: null,
    lastVerifiedAt: null,
    lastError: null,
};

const maskEmail = (value) => {
    if (typeof value !== 'string' || !value.includes('@')) return 'missing';
    const [local, domain] = value.split('@');
    return `${local.slice(0, 2)}***@${domain}`;
};

const getSmtpEnv = () => {
    const user = (process.env.SMTP_USER || process.env.EMAIL_USER || '').trim();
    const pass = (process.env.SMTP_PASS || process.env.EMAIL_PASS || '').trim();
    const host = (process.env.SMTP_HOST || process.env.EMAIL_HOST || 'smtp.gmail.com').trim();
    const port = Number(process.env.SMTP_PORT || process.env.EMAIL_PORT || 587);
    const secure = process.env.SMTP_SECURE === 'true' || port === 465;
    const from = (process.env.SMTP_FROM || process.env.EMAIL_FROM || user).trim();
    const isGmail = /gmail\.com$/i.test(host) || /gmail\.com$/i.test(user.split('@')[1] || '');

    return { user, pass, host, port, secure, from, isGmail };
};

const updateSmtpDiagnostics = (overrides = {}) => {
    smtpDiagnostics = {
        ...smtpDiagnostics,
        ...overrides,
    };
};

const hasSmtpConfig = () => {
    const { user, pass } = getSmtpEnv();
    return Boolean(user && pass);
};

const buildTransportConfig = () => {
    const { user, pass, host, port, secure, isGmail } = getSmtpEnv();

    if (isGmail) {
        return {
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            family: 4, // Force IPv4 to avoid ENETUNREACH on IPv6
            pool: true,
            maxConnections: 2,
            maxMessages: 50,
            connectionTimeout: 15000,
            greetingTimeout: 10000,
            socketTimeout: 20000,
            auth: { user, pass },
            tls: {
                minVersion: 'TLSv1.2',
                requireTLS: true
            },
        };
    }

    return {
        host,
        port,
        secure,
        pool: true,
        maxConnections: 2,
        maxMessages: 50,
        connectionTimeout: 15000,
        greetingTimeout: 10000,
        socketTimeout: 20000,
        auth: { user, pass },
        tls: {
            minVersion: 'TLSv1.2',
            requireTLS: port === 587,
        },
    };
};

const getTransporter = () => {
    if (!hasSmtpConfig()) {
        updateSmtpDiagnostics({
            configured: false,
            verified: false,
            provider: null,
            host: null,
            port: null,
            username: null,
            from: null,
            lastError: 'SMTP credentials are missing',
        });
        return null;
    }

    if (!cachedTransporter) {
        const { user, host, port, secure, from, isGmail } = getSmtpEnv();
        cachedTransporter = nodemailer.createTransport(buildTransportConfig());

        updateSmtpDiagnostics({
            configured: true,
            verified: false,
            provider: isGmail ? 'gmail' : 'smtp',
            host,
            port,
            username: maskEmail(user),
            from,
            lastError: null,
        });

        console.log('[SMTP] Transporter created', {
            provider: smtpDiagnostics.provider,
            host,
            port,
            secure,
            username: smtpDiagnostics.username,
            from,
        });
    }

    return cachedTransporter;
};

const normalizeMailError = (error) => {
    const code = error?.code || 'SMTP_SEND_FAILED';
    let userMessage = 'The email service could not deliver the verification code.';
    let status = 502;

    if (code === 'EAUTH') {
        userMessage = 'Email service authentication failed.';
    } else if (code === 'ETIMEDOUT' || code === 'ESOCKET' || code === 'ECONNECTION') {
        userMessage = 'Email service connection timed out.';
        status = 503;
    } else if (code === 'EENVELOPE') {
        userMessage = 'The email recipient address was rejected.';
        status = 400;
    }

    return Object.assign(new Error(userMessage), {
        code,
        status,
        cause: error,
    });
};

const sendMailOrLog = async ({ to, subject, html, debugLabel }) => {
    const transporter = getTransporter();

    if (!transporter) {
        if (process.env.NODE_ENV === 'production') {
            throw Object.assign(new Error(`SMTP is not configured for ${debugLabel}`), {
                code: 'SMTP_NOT_CONFIGURED',
                status: 500,
            });
        }

        console.log(`[${debugLabel.toUpperCase()}][DEV] ${to}`);
        return { delivered: false, debug: true };
    }

    const { from } = getSmtpEnv();

    try {
        const result = await transporter.sendMail({
            from,
            to,
            subject,
            html,
        });

        console.log('[SMTP] Email dispatched', {
            debugLabel,
            to: maskEmail(to),
            accepted: result.accepted,
            rejected: result.rejected,
            response: result.response,
            messageId: result.messageId,
        });

        return { delivered: true, debug: false };
    } catch (error) {
        updateSmtpDiagnostics({
            verified: false,
            lastError: error?.message || 'Unknown SMTP send failure',
        });
        console.error('[SMTP] sendMail failed', {
            debugLabel,
            to: maskEmail(to),
            code: error?.code,
            command: error?.command,
            response: error?.response,
            message: error?.message,
        });
        throw normalizeMailError(error);
    }
};

export const verifySmtpConnection = async () => {
    const transporter = getTransporter();
    if (!transporter) {
        console.log('[SMTP] No SMTP configuration found. Skipping verification.');
        updateSmtpDiagnostics({
            configured: false,
            verified: false,
            lastVerifiedAt: new Date().toISOString(),
        });
        return false;
    }

    try {
        await transporter.verify();
        updateSmtpDiagnostics({
            verified: true,
            lastVerifiedAt: new Date().toISOString(),
            lastError: null,
        });
        console.log('[SMTP] Connection verified successfully', {
            provider: smtpDiagnostics.provider,
            host: smtpDiagnostics.host,
            port: smtpDiagnostics.port,
            username: smtpDiagnostics.username,
        });
        return true;
    } catch (error) {
        updateSmtpDiagnostics({
            verified: false,
            lastVerifiedAt: new Date().toISOString(),
            lastError: error?.message || 'Unknown SMTP verification failure',
        });
        console.error('[SMTP] Verification failed:', {
            code: error?.code,
            command: error?.command,
            response: error?.response,
            message: error?.message,
        });
        return false;
    }
};

export const getSmtpDiagnostics = () => ({ ...smtpDiagnostics });

export const sendPasswordResetOtpEmail = async ({ to, otp, name, expiresInMinutes }) => {
    const subject = 'CodeArena 1v1 password reset code';
    const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
            <p>Hi ${name || 'there'},</p>
            <p>Your CodeArena 1v1 password reset code is:</p>
            <p style="font-size: 28px; font-weight: 700; letter-spacing: 6px;">${otp}</p>
            <p>This code expires in ${expiresInMinutes} minutes.</p>
            <p>If you did not request this, you can ignore this email.</p>
        </div>
    `;

    return sendMailOrLog({
        to,
        subject,
        html,
        debugLabel: 'password reset emails',
    });
};

export const sendAccountVerificationEmail = async ({ to, otp, name, expiresInMinutes }) => {
    const subject = 'Verify your CodeArena 1v1 account';
    const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #e5e7eb; background: #0f1117; padding: 24px;">
            <div style="max-width: 560px; margin: 0 auto; background: #121212; border: 1px solid #1f2937; border-radius: 20px; overflow: hidden;">
                <div style="padding: 28px; border-bottom: 1px solid #1f2937; background: linear-gradient(135deg, #0f172a 0%, #121212 100%);">
                    <p style="margin: 0 0 8px; color: #4ade80; font-size: 12px; letter-spacing: 0.18em; font-weight: 700; text-transform: uppercase;">CodeArena 1v1 Verification</p>
                    <h1 style="margin: 0; font-size: 24px; color: #f9fafb;">Welcome to the Arena!</h1>
                </div>
                <div style="padding: 28px;">
                    <p style="margin-top: 0; color: #d1d5db;">Hi ${name || 'there'},</p>
                    <p style="color: #d1d5db;">Thank you for joining CodeArena 1v1. To complete your registration and start battling, please verify your email address using the code below:</p>
                    <div style="margin: 24px 0; padding: 18px; border-radius: 16px; border: 1px solid #1f2937; background: #0b0d12; text-align: center;">
                        <p style="margin: 0 0 10px; color: #9ca3af; font-size: 12px; text-transform: uppercase; letter-spacing: 0.16em;">Verification Code</p>
                        <p style="margin: 0; font-size: 32px; letter-spacing: 8px; font-weight: 700; color: #4ade80;">${otp}</p>
                    </div>
                    <p style="color: #d1d5db;">This code expires in ${expiresInMinutes} minutes.</p>
                    <p style="color: #d1d5db;">If you didn't create an account, you can safely ignore this email.</p>
                </div>
            </div>
        </div>
    `;

    return sendMailOrLog({
        to,
        subject,
        html,
        debugLabel: 'account verification emails',
    });
};

export const sendSettingsOtpEmail = async ({ to, otp, name, expiresInMinutes, requestedChanges = [] }) => {
    const subject = 'CodeArena 1v1 security verification code';
    const changeSummary = requestedChanges.length
        ? requestedChanges.map((item) => `<li style="margin-bottom: 6px;">${item}</li>`).join('')
        : '<li style="margin-bottom: 6px;">Account security changes</li>';

    const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #e5e7eb; background: #0f1117; padding: 24px;">
            <div style="max-width: 560px; margin: 0 auto; background: #121212; border: 1px solid #1f2937; border-radius: 20px; overflow: hidden;">
                <div style="padding: 28px; border-bottom: 1px solid #1f2937; background: linear-gradient(135deg, #0f172a 0%, #121212 100%);">
                    <p style="margin: 0 0 8px; color: #4ade80; font-size: 12px; letter-spacing: 0.18em; font-weight: 700; text-transform: uppercase;">CodeArena 1v1 Security</p>
                    <h1 style="margin: 0; font-size: 24px; color: #f9fafb;">Verify your settings update</h1>
                </div>
                <div style="padding: 28px;">
                    <p style="margin-top: 0; color: #d1d5db;">Hi ${name || 'there'},</p>
                    <p style="color: #d1d5db;">We received a request to update sensitive settings on your CodeArena 1v1 account:</p>
                    <ul style="color: #f3f4f6; padding-left: 20px;">${changeSummary}</ul>
                    <div style="margin: 24px 0; padding: 18px; border-radius: 16px; border: 1px solid #1f2937; background: #0b0d12; text-align: center;">
                        <p style="margin: 0 0 10px; color: #9ca3af; font-size: 12px; text-transform: uppercase; letter-spacing: 0.16em;">Verification Code</p>
                        <p style="margin: 0; font-size: 32px; letter-spacing: 8px; font-weight: 700; color: #4ade80;">${otp}</p>
                    </div>
                    <p style="color: #d1d5db;">This code expires in ${expiresInMinutes} minutes. If you did not request this change, you can ignore this email and your account will remain unchanged.</p>
                </div>
            </div>
        </div>
    `;

    return sendMailOrLog({
        to,
        subject,
        html,
        debugLabel: 'settings verification emails',
    });
};

export const sendPaymentSubmissionEmail = async ({ to, name, planName, amount, utrNumber }) => {
    const subject = `CodeArena 1v1 payment received for ${planName}`;
    const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
            <p>Hi ${name || 'there'},</p>
            <p>We received your manual UPI payment request for <strong>${planName}</strong>.</p>
            <p>Amount: <strong>Rs. ${amount}</strong></p>
            <p>UTR: <strong>${utrNumber}</strong></p>
            <p>Our team is verifying the payment now. You will receive another email once it is approved or rejected.</p>
        </div>
    `;

    return sendMailOrLog({
        to,
        subject,
        html,
        debugLabel: 'payment submission emails',
    });
};

export const sendPaymentApprovedEmail = async ({ to, name, planName, amount }) => {
    const subject = `Welcome to CodeArena 1v1 ${planName}`;
    const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
            <p>Hi ${name || 'there'},</p>
            <p>Your payment for <strong>${planName}</strong> has been approved.</p>
            <p>Amount received: <strong>Rs. ${amount}</strong></p>
            <p>Welcome to Pro. Your premium access is now active in CodeArena 1v1.</p>
        </div>
    `;

    return sendMailOrLog({
        to,
        subject,
        html,
        debugLabel: 'payment approval emails',
    });
};

export const sendPaymentRejectedEmail = async ({ to, name, planName, amount, adminNotes }) => {
    const subject = 'CodeArena 1v1 payment could not be verified';
    const notesBlock = adminNotes
        ? `<p>Reviewer note: <strong>${adminNotes}</strong></p>`
        : '<p>Please check the UTR with your bank or payment app and try again.</p>';
    const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
            <p>Hi ${name || 'there'},</p>
            <p>We could not verify your payment request for <strong>${planName}</strong>.</p>
            <p>Amount expected: <strong>Rs. ${amount}</strong></p>
            ${notesBlock}
            <p>You can submit a fresh payment request with the correct 12-digit UTR once the issue is resolved.</p>
        </div>
    `;

    return sendMailOrLog({
        to,
        subject,
        html,
        debugLabel: 'payment rejection emails',
    });
};
