// ─────────────────────────────────────────────────────────────
// authEmailService.js — Production Email Service
// Uses Resend (HTTP API) as primary, Nodemailer (SMTP) as local fallback
//
// WHY: Render's free tier blocks outbound SMTP on ports 25, 465, and 587.
// No amount of Nodemailer config changes will fix this — the TCP packets
// are dropped at the network layer before they ever reach Gmail.
// Resend uses HTTPS (port 443) which is never blocked.
// ─────────────────────────────────────────────────────────────

// ── Provider detection ─────────────────────────────────────
// If RESEND_API_KEY is set → use Resend (HTTP, works on Render)
// If EMAIL_USER + EMAIL_PASS are set → use Nodemailer (SMTP, works locally)
// If neither → log to console in dev, throw in production

const getProvider = () => {
    if ((process.env.RESEND_API_KEY || '').trim()) return 'resend';
    if ((process.env.EMAIL_USER || '').trim() && (process.env.EMAIL_PASS || '').trim()) return 'nodemailer';
    return 'none';
};

// ═══════════════════════════════════════════════════════════
// RESEND PROVIDER (HTTP-based — works on Render, Vercel, etc.)
// ═══════════════════════════════════════════════════════════
let resendInstance = null;

const getResend = async () => {
    if (!resendInstance) {
        const { Resend } = await import('resend');
        resendInstance = new Resend(process.env.RESEND_API_KEY.trim());
    }
    return resendInstance;
};

const sendViaResend = async ({ to, subject, html, label }) => {
    const resend = await getResend();
    let from = (process.env.EMAIL_FROM || 'CodeArena 1v1 <onboarding@resend.dev>').trim();

    // ── PRO-TIP: Resend requires a verified domain to send emails. ──
    // On the free tier, you MUST send from 'onboarding@resend.dev' until you verify a custom domain.
    // If we detect a gmail/outlook address being used as 'from', we force it to the onboarding address
    // to prevent the 403 Forbidden 'Domain not verified' error.
    if (from.includes('@gmail.com') || from.includes('@outlook.com') || from.includes('@hotmail.com') || from.includes('@yahoo.com')) {
        console.warn(`[MAIL:RESEND] ⚠️  Gmail/Public domain detected in EMAIL_FROM (${from}). Forcing 'onboarding@resend.dev' to comply with Resend's security policy.`);
        from = 'CodeArena 1v1 <onboarding@resend.dev>';
    }

    console.log(`[MAIL:RESEND] Sending ${label} to ${maskEmail(to)} (From: ${from})...`);

    const { data, error } = await resend.emails.send({ from, to: [to], subject, html });

    if (error) {
        console.error(`[MAIL:RESEND] ❌ ${label} failed`, error);
        throw Object.assign(new Error(error.message || 'Resend delivery failed'), {
            code: 'RESEND_SEND_FAILED', status: 502,
        });
    }

    console.log(`[MAIL:RESEND] ✅ ${label} sent`, { id: data?.id });
    return { delivered: true, debug: false };
};

// ═══════════════════════════════════════════════════════════
// NODEMAILER PROVIDER (SMTP — works locally, NOT on Render free tier)
// ═══════════════════════════════════════════════════════════
import nodemailer from 'nodemailer';
import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');

let smtpTransporter = null;

const createSmtpTransporter = () => {
    const user = (process.env.EMAIL_USER || '').trim();
    const pass = (process.env.EMAIL_PASS || '').trim();
    const host = (process.env.EMAIL_HOST || 'smtp.gmail.com').trim();
    const port = Number(process.env.EMAIL_PORT || 587);

    return nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
        connectionTimeout: 10_000,
        greetingTimeout: 10_000,
        socketTimeout: 15_000,
        tls: { rejectUnauthorized: false },
    });
};

const sendViaNodemailer = async ({ to, subject, html, label }) => {
    if (!smtpTransporter) {
        smtpTransporter = createSmtpTransporter();
    }

    const from = (process.env.EMAIL_FROM || process.env.EMAIL_USER || '').trim();

    console.log(`[MAIL:SMTP] Sending ${label} to ${maskEmail(to)}...`);

    try {
        const info = await smtpTransporter.sendMail({ from, to, subject, html });
        console.log(`[MAIL:SMTP] ✅ ${label} sent`, { messageId: info.messageId });
        return { delivered: true, debug: false };
    } catch (err) {
        console.error(`[MAIL:SMTP] ❌ ${label} failed`, { code: err.code, message: err.message });
        // Reset transporter on connection errors
        if (['ETIMEDOUT', 'ESOCKET', 'ECONNECTION', 'ECONNREFUSED', 'ENETUNREACH'].includes(err.code)) {
            smtpTransporter = null;
        }
        throw Object.assign(new Error('Email delivery failed'), {
            code: err.code || 'SMTP_SEND_FAILED', status: 502, cause: err,
        });
    }
};

// ═══════════════════════════════════════════════════════════
// UNIFIED SEND (routes to the correct provider)
// ═══════════════════════════════════════════════════════════
const sendMail = async ({ to, subject, html, label }) => {
    const provider = getProvider();

    if (provider === 'resend') {
        return sendViaResend({ to, subject, html, label });
    }

    if (provider === 'nodemailer') {
        return sendViaNodemailer({ to, subject, html, label });
    }

    // No provider configured
    if (process.env.NODE_ENV === 'production') {
        throw Object.assign(new Error('No email provider configured'), {
            code: 'MAIL_NOT_CONFIGURED', status: 500,
        });
    }

    console.log(`[MAIL:DEV] ${label} → ${to} (no provider, logging only)`);
    return { delivered: false, debug: true };
};

// ── Startup verification ───────────────────────────────────
export const verifySmtpConnection = async () => {
    const provider = getProvider();
    console.log(`[MAIL] Provider: ${provider}`);

    if (provider === 'resend') {
        console.log('[MAIL] ✅ Resend API key configured — HTTP-based delivery ready.');
        return true;
    }

    if (provider === 'nodemailer') {
        if (!smtpTransporter) smtpTransporter = createSmtpTransporter();
        try {
            await smtpTransporter.verify();
            console.log('[MAIL] ✅ SMTP connection verified.');
            return true;
        } catch (err) {
            console.error('[MAIL] ❌ SMTP verification failed:', err.code, err.message);
            console.warn('[MAIL] ⚠️  If you are on Render free tier, SMTP is blocked. Set RESEND_API_KEY instead.');
            smtpTransporter = null;
            return false;
        }
    }

    console.warn('[MAIL] ⚠️  No email provider configured. Set RESEND_API_KEY or EMAIL_USER+EMAIL_PASS.');
    return false;
};

export const getSmtpDiagnostics = () => ({
    provider: getProvider(),
    configured: getProvider() !== 'none',
});

// ── Helper ─────────────────────────────────────────────────
const maskEmail = (value) => {
    if (typeof value !== 'string' || !value.includes('@')) return 'missing';
    const [local, domain] = value.split('@');
    return `${local.slice(0, 2)}***@${domain}`;
};

// ── Branded HTML templates ─────────────────────────────────
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
// PUBLIC API — all exports match the original signatures
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
