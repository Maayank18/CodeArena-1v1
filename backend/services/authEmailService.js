// ─────────────────────────────────────────────────────────────
// authEmailService.js — Production-grade Nodemailer for Render
// Rebuilt from scratch to fix IPv6/ETIMEDOUT on cloud hosting
// ─────────────────────────────────────────────────────────────
import nodemailer from 'nodemailer';
import dns from 'dns';

// ── CRITICAL FIX: Force Node.js DNS to resolve IPv4 first ──
// Render's network frequently resolves Gmail's SMTP to an IPv6
// address that is unreachable from their infrastructure.
// This single line fixes the ENETUNREACH error at the OS level
// before Nodemailer even creates a socket.
dns.setDefaultResultOrder('ipv4first');

// ── Transporter singleton ──────────────────────────────────
let transporter = null;

const createTransporter = () => {
    const user = (process.env.EMAIL_USER || '').trim();
    const pass = (process.env.EMAIL_PASS || '').trim();
    const host = (process.env.EMAIL_HOST || 'smtp.gmail.com').trim();
    const port = Number(process.env.EMAIL_PORT || 587);
    const from = (process.env.EMAIL_FROM || user).trim();

    if (!user || !pass) {
        console.warn('[MAIL] ⚠️  EMAIL_USER or EMAIL_PASS is missing. Emails will be logged to console.');
        return null;
    }

    const t = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
        connectionTimeout: 10_000,
        greetingTimeout: 10_000,
        socketTimeout: 15_000,
        tls: { rejectUnauthorized: false },
    });

    console.log('[MAIL] ✅ Transporter created', { host, port, user: maskEmail(user), from });
    return t;
};

const getTransporter = () => {
    if (!transporter) {
        transporter = createTransporter();
    }
    return transporter;
};

// ── Startup verification (non-blocking) ────────────────────
export const verifySmtpConnection = async () => {
    const t = getTransporter();
    if (!t) {
        console.log('[MAIL] Skipping SMTP verification — no credentials configured.');
        return false;
    }

    try {
        await t.verify();
        console.log('[MAIL] ✅ SMTP connection verified — server is ready to send.');
        return true;
    } catch (err) {
        console.error('[MAIL] ❌ SMTP verification failed:', err.code, err.message);
        // Reset transporter so the next send attempt creates a fresh one
        transporter = null;
        return false;
    }
};

// ── Diagnostics (for health endpoint) ──────────────────────
export const getSmtpDiagnostics = () => {
    const user = (process.env.EMAIL_USER || '').trim();
    return {
        configured: Boolean(user && (process.env.EMAIL_PASS || '').trim()),
        host: (process.env.EMAIL_HOST || 'smtp.gmail.com').trim(),
        port: Number(process.env.EMAIL_PORT || 587),
        user: maskEmail(user),
    };
};

// ── Core send function ─────────────────────────────────────
const sendMail = async ({ to, subject, html, label }) => {
    const t = getTransporter();

    // Dev fallback — log OTP to console if SMTP is not configured
    if (!t) {
        if (process.env.NODE_ENV === 'production') {
            throw Object.assign(new Error('SMTP is not configured'), { code: 'SMTP_NOT_CONFIGURED', status: 500 });
        }
        console.log(`[MAIL][DEV] ${label} → ${to}`);
        return { delivered: false, debug: true };
    }

    const from = (process.env.EMAIL_FROM || process.env.EMAIL_USER || '').trim();

    console.log(`[MAIL] Sending ${label} to ${maskEmail(to)}...`);

    try {
        const info = await t.sendMail({ from, to, subject, html });
        console.log(`[MAIL] ✅ ${label} sent`, { messageId: info.messageId, accepted: info.accepted });
        return { delivered: true, debug: false };
    } catch (err) {
        console.error(`[MAIL] ❌ ${label} failed`, { code: err.code, command: err.command, message: err.message });
        // Reset transporter on connection errors so a fresh one is created next time
        if (['ETIMEDOUT', 'ESOCKET', 'ECONNECTION', 'ECONNREFUSED', 'ENETUNREACH'].includes(err.code)) {
            transporter = null;
        }
        throw Object.assign(new Error('Email delivery failed'), { code: err.code || 'SMTP_SEND_FAILED', status: 502, cause: err });
    }
};

// ── Helper ─────────────────────────────────────────────────
const maskEmail = (value) => {
    if (typeof value !== 'string' || !value.includes('@')) return 'missing';
    const [local, domain] = value.split('@');
    return `${local.slice(0, 2)}***@${domain}`;
};

// ── Branded email wrapper ──────────────────────────────────
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

// ═══════════════════════════════════════════════════════════
// PUBLIC API — each function matches the old export signature
// ═══════════════════════════════════════════════════════════

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
                <p style="color:#d1d5db">If you didn't create an account, you can safely ignore this email.</p>`,
        }),
    });

export const sendSettingsOtpEmail = ({ to, otp, name, expiresInMinutes, requestedChanges = [] }) => {
    const changeSummary = requestedChanges.length
        ? requestedChanges.map((item) => `<li style="margin-bottom:6px">${item}</li>`).join('')
        : '<li style="margin-bottom:6px">Account security changes</li>';

    return sendMail({
        to,
        subject: 'CodeArena 1v1 security verification code',
        label: 'Settings OTP',
        html: brandedHtml({
            heading: 'Verify your settings update',
            subtitle: 'CodeArena 1v1 Security',
            bodyHtml: `
                <p style="margin-top:0;color:#d1d5db">Hi ${name || 'there'},</p>
                <p style="color:#d1d5db">We received a request to update sensitive settings on your account:</p>
                <ul style="color:#f3f4f6;padding-left:20px">${changeSummary}</ul>
                ${otpBlock(otp, expiresInMinutes)}
                <p style="color:#d1d5db">If you did not request this change, you can ignore this email.</p>`,
        }),
    });
};

export const sendPasswordResetOtpEmail = ({ to, otp, name, expiresInMinutes }) =>
    sendMail({
        to,
        subject: 'CodeArena 1v1 password reset code',
        label: 'Password Reset',
        html: `
            <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111827">
                <p>Hi ${name || 'there'},</p>
                <p>Your CodeArena 1v1 password reset code is:</p>
                <p style="font-size:28px;font-weight:700;letter-spacing:6px">${otp}</p>
                <p>This code expires in ${expiresInMinutes} minutes.</p>
                <p>If you did not request this, you can ignore this email.</p>
            </div>`,
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
