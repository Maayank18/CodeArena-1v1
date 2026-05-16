/**
 * authEmailService.js
 * Production-grade Gmail API (HTTPS) email service.
 * 
 * RESOLVES: Render boot-time timeouts and SMTP socket blocks by using 
 * the official Google Gmail API over HTTPS (Port 443).
 */

import { google } from 'googleapis';
import nodemailer from 'nodemailer';

// ─── Environment Detection ──────────────────────────────────────────────────
const IS_PROD = process.env.NODE_ENV === 'production';

// ─── Configuration ──────────────────────────────────────────────────────────

const getAuthConfig = () => ({
    clientId:     (process.env.GMAIL_CLIENT_ID || '').trim(),
    clientSecret: (process.env.GMAIL_CLIENT_SECRET || '').trim(),
    refreshToken: (process.env.GMAIL_REFRESH_TOKEN || '').trim(),
    senderEmail:  (process.env.GMAIL_SENDER_EMAIL || process.env.EMAIL_USER || '').trim(),
    fromName:     (process.env.EMAIL_FROM_NAME || 'CodeArena 1v1').trim(),
});

// Retry policy (Preserved)
const RETRY_POLICY = {
    maxAttempts: 3,
    baseDelayMs: 800,
    maxDelayMs: 5000,
};

// ─── Singleton Clients (Lazy Loaded) ────────────────────────────────────────

let _oauth2Client = null;
let _gmailApi = null;
let _devTransporter = null;

/**
 * Lazy-loads the Gmail API client for Production (HTTPS).
 */
const getGmailClient = async () => {
    if (_gmailApi) return _gmailApi;

    const config = getAuthConfig();
    if (!config.clientId || !config.clientSecret || !config.refreshToken) {
        throw makeEmailError('Gmail API credentials missing.', 'OAUTH_CONFIG_ERROR', 500, false);
    }

    _oauth2Client = new google.auth.OAuth2(
        config.clientId,
        config.clientSecret,
        'https://developers.google.com/oauthplayground'
    );
    _oauth2Client.setCredentials({ refresh_token: config.refreshToken });

    _gmailApi = google.gmail({ version: 'v1', auth: _oauth2Client });
    console.log('[EMAIL] 🛡️ Gmail API (HTTPS) Client initialized for production');
    
    return _gmailApi;
};

/**
 * Lazy-loads Nodemailer for Local Development (SMTP).
 */
const getDevTransporter = async () => {
    if (_devTransporter) return _devTransporter;

    // Use SMTP logic for dev if EMAIL_PASS is present, else attempt OAuth
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;

    if (user && pass) {
        _devTransporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user, pass }
        });
        console.log('[EMAIL] 🛠️ Local SMTP Transporter initialized');
    } else {
        // Fallback to OAuth transporter for dev if configured
        const config = getAuthConfig();
        _devTransporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                type: 'OAuth2',
                user: config.senderEmail,
                clientId: config.clientId,
                clientSecret: config.clientSecret,
                refreshToken: config.refreshToken,
            }
        });
        console.log('[EMAIL] 🛠️ Local OAuth2 Transporter initialized');
    }
    return _devTransporter;
};

// ─── Error Handling ──────────────────────────────────────────────────────────

const makeEmailError = (message, code, status = 502, retryable = true) => {
    const err = new Error(message);
    err.code     = code;
    err.status   = status;
    err.retryable = retryable;
    return err;
};

const classifyError = (err) => {
    const msg = err.message || '';
    if (msg.includes('invalid_grant') || msg.includes('token')) {
        return makeEmailError('Gmail Auth Failed (Invalid Token)', 'AUTH_FAILED', 500, false);
    }
    if (msg.includes('quota') || msg.includes('rateLimit')) {
        return makeEmailError('Gmail API Quota Exceeded', 'QUOTA_EXCEEDED', 502, true);
    }
    return makeEmailError(`Email failed: ${msg}`, 'SEND_FAILED', 502, true);
};

// ─── Gmail API Helper ────────────────────────────────────────────────────────

/**
 * Encodes the email as a base64url string for the Gmail API.
 */
const createEncodedEmail = ({ from, to, subject, html, text }) => {
    const boundary = '____boundary____';
    const email = [
        `From: ${from.name} <${from.address}>`,
        `To: ${to}`,
        `Subject: ${subject}`,
        'MIME-Version: 1.0',
        `Content-Type: multipart/alternative; boundary="${boundary}"`,
        '',
        `--${boundary}`,
        'Content-Type: text/plain; charset="UTF-8"',
        'Content-Transfer-Encoding: 7bit',
        '',
        text || '',
        '',
        `--${boundary}`,
        'Content-Type: text/html; charset="UTF-8"',
        'Content-Transfer-Encoding: 7bit',
        '',
        html || '',
        '',
        `--${boundary}--`
    ].join('\r\n');

    return Buffer.from(email)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
};

// ─── Send Logic ──────────────────────────────────────────────────────────────

const sendEmail = async ({ to, subject, html, text }) => {
    const config = getAuthConfig();
    const sleep = (ms) => new Promise(r => setTimeout(r, ms));

    for (let attempt = 1; attempt <= RETRY_POLICY.maxAttempts; attempt++) {
        try {
            if (IS_PROD) {
                // PRODUCTION: DIRECT GMAIL API (HTTPS)
                const gmail = await getGmailClient();
                const raw = createEncodedEmail({ 
                    from: { name: config.fromName, address: config.senderEmail }, 
                    to, subject, html, text 
                });

                console.log(`[EMAIL] Dispatching via Gmail API (Attempt ${attempt})...`);
                const res = await gmail.users.messages.send({
                    userId: 'me',
                    requestBody: { raw }
                });

                console.log(`[EMAIL] ✅ Sent successfully via API. ID: ${res.data.id}`);
                return { delivered: true, messageId: res.data.id };
            } else {
                // DEVELOPMENT: NODEMAILER (SMTP)
                const transporter = await getDevTransporter();
                const from = { name: config.fromName, address: config.senderEmail };
                
                console.log(`[EMAIL] Dispatching via Nodemailer (Attempt ${attempt})...`);
                const info = await transporter.sendMail({ from, to, subject, html, text });
                
                console.log(`[EMAIL] ✅ Sent successfully via Nodemailer. ID: ${info.messageId}`);
                return { delivered: true, messageId: info.messageId };
            }
        } catch (err) {
            const structured = classifyError(err);
            console.error(`[EMAIL] Attempt ${attempt} failed:`, structured.message);
            
            if (!structured.retryable || attempt === RETRY_POLICY.maxAttempts) throw structured;
            
            const delay = Math.min(RETRY_POLICY.baseDelayMs * Math.pow(2, attempt - 1), RETRY_POLICY.maxDelayMs);
            await sleep(delay);
        }
    }
};

// ─── Startup Verification ─────────────────────────────────────────────────────

/**
 * Non-blocking startup verification.
 * In production, it only checks if credentials exist, bypassing network calls.
 */
export const verifySmtpConnection = async () => {
    const config = getAuthConfig();

    if (IS_PROD) {
        // PRODUCTION: CONFIG-ONLY CHECK (No network call to prevent startup timeout)
        const isConfigured = !!(config.clientId && config.refreshToken);
        if (isConfigured) {
            console.log(`[BOOT:EMAIL] ✅ Gmail API configured for sender: ${config.senderEmail}`);
        } else {
            console.warn('[BOOT:EMAIL] ⚠️ Gmail API configuration is INCOMPLETE.');
        }
        return isConfigured;
    } else {
        // DEVELOPMENT: ACTUAL VERIFICATION
        try {
            const transporter = await getDevTransporter();
            await transporter.verify();
            console.log('[BOOT:EMAIL] ✅ Local Email verified.');
            return true;
        } catch (err) {
            console.warn('[BOOT:EMAIL] ❌ Local Email verification failed:', err.message);
            return false;
        }
    }
};

// Diagnostic compatibility
export const getSmtpDiagnostics = () => {
    const config = getAuthConfig();
    return {
        mode: IS_PROD ? 'Production (Gmail API HTTPS)' : 'Development (Nodemailer)',
        configured: !!(config.clientId && config.refreshToken),
        sender: config.senderEmail ? `${config.senderEmail.slice(0, 4)}***` : null
    };
};

// ─── Templates (Preserved) ────────────────────────────────────────────────────

// ─── Templates ────────────────────────────────────────────────────────────

/**
 * Builds a professional, clean HTML template for OTP emails.
 */
const buildOtpEmailHtml = ({ title, otp, bodyText, expiresInMinutes, appName = 'CodeArena 1v1' }) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#0d0d0d;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout:fixed;background-color:#0d0d0d;">
        <tr>
            <td align="center" style="padding:40px 20px;">
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:500px;background-color:#161616;border:1px solid #2a2a2a;border-radius:24px;overflow:hidden;box-shadow:0 20px 50px rgba(0,0,0,0.5);">
                    <!-- Header/Branding -->
                    <tr>
                        <td align="center" style="padding:48px 40px 24px 40px;">
                            <div style="text-align:center; margin-bottom: 20px;">
                                <img src="https://codearena1v1.com/logo.png" alt="CodeArena 1v1 Logo" style="width:80px;height:80px;display:block;margin:0 auto;" />
                            </div>
                            <div style="background-color:#0d0d0d;padding:12px 24px;border:1px solid #2a2a2a;border-radius:14px;display:inline-block;">
                                <span style="font-size:22px;font-weight:900;color:#4ade80;letter-spacing:1px;text-transform:uppercase;">${appName}</span>
                            </div>
                        </td>
                    </tr>
                    <!-- Main Content -->
                    <tr>
                        <td style="padding:0 40px 40px 40px;text-align:center;">
                            <h2 style="margin:0 0 16px 0;color:#ffffff;font-size:26px;font-weight:800;letter-spacing:-0.5px;">${title}</h2>
                            <p style="margin:0;color:#a3a3a3;font-size:16px;line-height:1.6;">
                                ${bodyText}
                            </p>
                            
                            <!-- Verification Code Display -->
                            <div style="margin:36px 0;padding:36px 20px;background-color:#0d0d0d;border:1px solid #2a2a2a;border-radius:20px;text-align:center;">
                                <p style="margin:0 0 10px 0;font-size:12px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:2px;">Security Code</p>
                                <div style="font-family:'Monaco','Consolas','Courier New',monospace;font-size:48px;font-weight:800;color:#4ade80;letter-spacing:10px;line-height:1;">${otp}</div>
                            </div>

                            <p style="margin:0 0 12px 0;color:#6b7280;font-size:14px;line-height:1.6;">
                                This code expires in <strong style="color:#ffffff;">${expiresInMinutes} minutes</strong>.
                            </p>
                            <p style="margin:0;color:#4b5563;font-size:12px;font-style:italic;">
                                If you didn't request this, please ignore this email or contact support if you have concerns.
                            </p>
                        </td>
                    </tr>
                    <!-- Branded Footer -->
                    <tr>
                        <td style="padding:40px;background-color:#0d0d0d;text-align:center;border-top:1px solid #2a2a2a;">
                            <p style="margin:0 0 6px 0;color:#ffffff;font-size:15px;font-weight:800;">CodeArena 1v1</p>
                            <p style="margin:0;color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;font-weight:600;">The Ultimate Battleground for Developers</p>
                            <div style="margin-top:24px;padding-top:24px;border-top:1px solid #1a1a1a;font-size:11px;color:#374151;">
                                &copy; 2026 CodeArena 1v1. All rights reserved.
                            </div>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`;

/**
 * Builds a professional HTML receipt for plan purchases.
 */
const buildReceiptEmailHtml = ({ name, planName, amount, invoiceId, date, expiryDate }) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#0d0d0d;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout:fixed;background-color:#0d0d0d;">
        <tr>
            <td align="center" style="padding:40px 20px;">
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;background-color:#161616;border:1px solid #2a2a2a;border-radius:24px;overflow:hidden;box-shadow:0 20px 50px rgba(0,0,0,0.5);">
                    <!-- Header -->
                    <tr>
                        <td align="center" style="padding:48px 40px;background-color:#0d0d0d;border-bottom:1px solid #2a2a2a;">
                            <div style="text-align:center; margin-bottom: 20px;">
                                <img src="https://codearena1v1.com/logo.png" alt="CodeArena 1v1 Logo" style="width:80px;height:80px;display:block;margin:0 auto;" />
                            </div>
                            <div style="background-color:#161616;padding:12px 24px;border:1px solid #2a2a2a;border-radius:14px;display:inline-block;">
                                <span style="font-size:22px;font-weight:900;color:#4ade80;letter-spacing:1px;text-transform:uppercase;">CodeArena 1v1</span>
                            </div>
                            <h1 style="margin:24px 0 0 0;color:#ffffff;font-size:26px;font-weight:800;letter-spacing:-0.5px;">Purchase Successful!</h1>
                        </td>
                    </tr>
                    <!-- Body -->
                    <tr>
                        <td style="padding:40px;">
                            <p style="margin:0 0 24px 0;color:#a3a3a3;font-size:16px;line-height:1.6;">
                                Hi ${name},<br><br>
                                Great news! Your payment for the <strong style="color:#ffffff;">${planName}</strong> membership has been verified and approved. Your account has been upgraded successfully.
                            </p>

                            <!-- Receipt Box -->
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#0d0d0d;border:1px solid #2a2a2a;border-radius:20px;overflow:hidden;">
                                <tr>
                                    <td style="padding:24px;border-bottom:1px solid #2a2a2a;">
                                        <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                            <tr>
                                                <td style="color:#6b7280;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Invoice ID</td>
                                                <td align="right" style="color:#ffffff;font-family:monospace;font-size:13px;font-weight:700;">${invoiceId}</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding:24px;">
                                        <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                            <tr style="margin-bottom:12px;">
                                                <td style="color:#a3a3a3;font-size:14px;padding-bottom:10px;">Membership Plan</td>
                                                <td align="right" style="color:#ffffff;font-size:14px;font-weight:700;padding-bottom:10px;">${planName}</td>
                                            </tr>
                                            <tr>
                                                <td style="color:#a3a3a3;font-size:14px;padding-bottom:10px;">Amount Paid</td>
                                                <td align="right" style="color:#4ade80;font-size:20px;font-weight:800;padding-bottom:10px;">Rs. ${amount}</td>
                                            </tr>
                                            <tr>
                                                <td style="color:#a3a3a3;font-size:14px;padding-bottom:10px;">Date Issued</td>
                                                <td align="right" style="color:#ffffff;font-size:14px;padding-bottom:10px;">${date}</td>
                                            </tr>
                                            <tr>
                                                <td style="color:#a3a3a3;font-size:14px;">Validity Period</td>
                                                <td align="right" style="color:#ffffff;font-size:14px;font-weight:700;">30 Days (Until ${expiryDate})</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <!-- What's Next -->
                            <div style="margin-top:36px;">
                                <h3 style="color:#ffffff;font-size:14px;font-weight:800;text-transform:uppercase;letter-spacing:1px;margin-bottom:16px;">Premium Benefits Unlocked:</h3>
                                <ul style="margin:0;padding:0;list-style:none;">
                                    <li style="color:#a3a3a3;font-size:14px;margin-bottom:10px;padding-left:24px;position:relative;">
                                        <span style="position:absolute;left:0;color:#4ade80;font-weight:bold;">✔</span> Access to all Pro Battle Arenas & Visualizers
                                    </li>
                                    <li style="color:#a3a3a3;font-size:14px;margin-bottom:10px;padding-left:24px;position:relative;">
                                        <span style="position:absolute;left:0;color:#4ade80;font-weight:bold;">✔</span> Custom Battle Rooms with advanced features
                                    </li>
                                    <li style="color:#a3a3a3;font-size:14px;margin-bottom:10px;padding-left:24px;position:relative;">
                                        <span style="position:absolute;left:0;color:#4ade80;font-weight:bold;">✔</span> Exclusive Badges and Profile Customizations
                                    </li>
                                </ul>
                            </div>

                            <div style="margin-top:40px;text-align:center;">
                                <a href="https://codearena1v1.com/dashboard" style="background-color:#4ade80;color:#000000;padding:18px 36px;border-radius:14px;text-decoration:none;font-weight:900;font-size:14px;display:inline-block;text-transform:uppercase;letter-spacing:1px;box-shadow:0 10px 20px rgba(74,222,128,0.2);">Launch Arena</a>
                            </div>
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style="padding:40px;background-color:#0d0d0d;text-align:center;border-top:1px solid #2a2a2a;">
                            <p style="margin:0;color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;font-weight:600;line-height:1.5;">
                                A PDF copy of this invoice is available for download in your <br>Account Settings > Subscription History.
                            </p>
                            <div style="margin-top:24px;font-size:11px;color:#374151;">
                                &copy; 2026 CodeArena 1v1. The Ultimate Battleground for Developers.
                            </div>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`;

/**
 * Builds a clean plain-text fallback for receipts.
 */
const buildReceiptEmailText = ({ name, planName, amount, invoiceId, date, expiryDate }) => `
CodeArena 1v1 - Purchase Receipt
-----------------------------------------

Hi ${name},

Your purchase of the ${planName} membership was successful!

ORDER DETAILS:
- Invoice ID: ${invoiceId}
- Plan: ${planName}
- Amount Paid: Rs. ${amount}
- Date: ${date}
- Valid Until: ${expiryDate}

Your account has been upgraded to Pro status. You now have full access to premium arenas, visualizers, and custom room features.

You can download your PDF invoice anytime from your account settings.

Keep coding and climbing the ranks!

--
CodeArena 1v1
The Ultimate Battleground for Developers
(c) 2026 CodeArena
`;

export const sendPurchaseReceiptEmail = async (args) => {
    const { to, name, planName, amount, invoiceId, date, expiryDate } = args;
    const title = 'Your CodeArena 1v1 Purchase Receipt / Invoice';
    
    return sendEmail({
        to,
        subject: title,
        html: buildReceiptEmailHtml({ name, planName, amount, invoiceId, date, expiryDate }),
        text: buildReceiptEmailText({ name, planName, amount, invoiceId, date, expiryDate })
    });
};

/**
 * Builds a clean plain-text fallback for OTP emails.
 */
const buildOtpEmailText = ({ title, otp, bodyText, expiresInMinutes, appName = 'CodeArena 1v1' }) => `
${appName} - ${title}
-----------------------------------------

${bodyText}

Verification Code: ${otp}

This code will expire in ${expiresInMinutes} minutes.

If you didn't request this, you can safely ignore this email.

--
CodeArena 1v1
The Ultimate Battleground for Developers
(c) 2026 CodeArena
`;

// ─── Public API ─────────────────────────────────────────────────────────────

export const sendAccountVerificationEmail = async (args) => {
    const title = 'Verify Your Email';
    const bodyText = `Hi ${args.name}, welcome to the arena! Use the code below to complete your registration.`;
    
    return sendEmail({
        to: args.to,
        subject: `${args.otp} - ${title}`, // Fixed: Hyphen instead of em-dash
        html: buildOtpEmailHtml({ title, otp: args.otp, bodyText, expiresInMinutes: args.expiresInMinutes }),
        text: buildOtpEmailText({ title, otp: args.otp, bodyText, expiresInMinutes: args.expiresInMinutes })
    });
};

export const sendPasswordResetOtpEmail = async (args) => {
    const title = 'Reset Your Password';
    const bodyText = `Hi ${args.name}, we received a request to reset your password. Use the code below to proceed.`;
    
    return sendEmail({
        to: args.to,
        subject: `${args.otp} - ${title}`, // Fixed: Hyphen instead of em-dash
        html: buildOtpEmailHtml({ title, otp: args.otp, bodyText, expiresInMinutes: args.expiresInMinutes }),
        text: buildOtpEmailText({ title, otp: args.otp, bodyText, expiresInMinutes: args.expiresInMinutes })
    });
};

export const sendSettingsOtpEmail = async (args) => {
    const title = 'Security Verification';
    const bodyText = `Hi ${args.name}, please use the code below to confirm your security settings change.`;
    
    return sendEmail({
        to: args.to,
        subject: `${args.otp} - ${title}`, // Fixed: Hyphen instead of em-dash
        html: buildOtpEmailHtml({ title, otp: args.otp, bodyText, expiresInMinutes: args.expiresInMinutes }),
        text: buildOtpEmailText({ title, otp: args.otp, bodyText, expiresInMinutes: args.expiresInMinutes })
    });
};

export const sendPaymentSubmissionEmail = async (args) => {
    return sendEmail({
        to: args.to,
        subject: `Payment Received - ${args.planName}`,
        html: `<p>Hi ${args.name}, we've received your payment of Rs. ${args.amount} for the <strong>${args.planName}</strong> plan. We are currently verifying your UTR.</p>`,
        text: `Hi ${args.name}, we've received your payment of Rs. ${args.amount} for the ${args.planName} plan. We are currently verifying your UTR.`
    });
};

export const sendPaymentApprovedEmail = async (args) => {
    return sendEmail({
        to: args.to,
        subject: `Payment Approved - ${args.planName}`,
        html: `<p>Congratulations ${args.name}! Your payment for <strong>${args.planName}</strong> has been approved. Your account has been upgraded.</p>`,
        text: `Congratulations ${args.name}! Your payment for ${args.planName} has been approved. Your account has been upgraded.`
    });
};

export const sendPaymentRejectedEmail = async (args) => {
    return sendEmail({
        to: args.to,
        subject: `Payment Rejected - ${args.planName}`,
        html: `<p>Hi ${args.name}, your payment for <strong>${args.planName}</strong> was rejected. Reason: ${args.adminNotes}</p>`,
        text: `Hi ${args.name}, your payment for ${args.planName} was rejected. Reason: ${args.adminNotes}`
    });
};
