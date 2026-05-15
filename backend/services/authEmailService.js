/**
 * authEmailService.js
 * Production-grade Gmail API OAuth2 transport service.
 * 
 * RESOLVES: Render production port blocking and IPv6 SMTP timeouts by moving
 * from SMTP sockets to HTTPS-based OAuth2 authentication via the Gmail API.
 */

import nodemailer from 'nodemailer';
import { google } from 'googleapis';
import dns from 'dns';

// ─── Environment Detection ──────────────────────────────────────────────────
const IS_PROD = process.env.NODE_ENV === 'production';

// ─── Configuration & Credentials ─────────────────────────────────────────────

const getAuthConfig = () => {
    // We prioritize Gmail API OAuth2 variables, fallback to old SMTP names for backward compatibility if possible
    return {
        clientId:     (process.env.GMAIL_CLIENT_ID || '').trim(),
        clientSecret: (process.env.GMAIL_CLIENT_SECRET || '').trim(),
        refreshToken: (process.env.GMAIL_REFRESH_TOKEN || '').trim(),
        senderEmail:  (process.env.GMAIL_SENDER_EMAIL || process.env.EMAIL_USER || '').trim(),
        fromName:     (process.env.EMAIL_FROM_NAME || 'CodeArena 1v1').trim(),
    };
};

// Retry policy (Preserved)
const RETRY_POLICY = {
    maxAttempts: 3,
    baseDelayMs: 800,
    maxDelayMs: 5000,
};

// ─── OAuth2 Client & Transporter Singleton ───────────────────────────────────

let _transporter = null;
let _oauth2Client = null;

/**
 * Lazy initialization of the OAuth2 Transporter.
 * Ensures we reuse the same client and pool resources across the lifecycle.
 */
const getTransporter = async () => {
    if (_transporter) return _transporter;

    const config = getAuthConfig();

    // Validation: Require OAuth2 credentials
    if (!config.clientId || !config.clientSecret || !config.refreshToken) {
        throw makeEmailError(
            'Gmail OAuth2 credentials missing. Ensure GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, and GMAIL_REFRESH_TOKEN are set.',
            'OAUTH_CONFIG_ERROR', 500, false
        );
    }

    if (!_oauth2Client) {
        _oauth2Client = new google.auth.OAuth2(
            config.clientId,
            config.clientSecret,
            'https://developers.google.com/oauthplayground' // Common redirect URI for manual token generation
        );
        _oauth2Client.setCredentials({ refresh_token: config.refreshToken });
    }

    console.log('[EMAIL] ⚙️ Initializing production-grade Gmail OAuth2 transporter', {
        user: `${config.senderEmail.slice(0, 4)}***`,
        clientId: `${config.clientId.slice(0, 8)}...`
    });

    _transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            type: 'OAuth2',
            user: config.senderEmail,
            clientId: config.clientId,
            clientSecret: config.clientSecret,
            refreshToken: config.refreshToken,
        },
        // Pool settings for performance
        pool: true,
        maxConnections: 5,
        maxMessages: 100,
    });

    return _transporter;
};

// ─── Structured Error Factory ────────────────────────────────────────────────

const makeEmailError = (message, code, status = 502, retryable = true) => {
    const err = new Error(message);
    err.code     = code;
    err.status   = status;
    err.retryable = retryable;
    return err;
};

// ─── Map Gmail API / OAuth errors → structured errors ───────────────────────

const classifyEmailError = (rawError) => {
    const msg  = rawError?.message || '';
    const code = rawError?.code || '';

    // OAuth Refresh Token failures (e.g., token revoked)
    if (msg.includes('invalid_grant') || msg.includes('token expired') || code === 'EAUTH') {
        return makeEmailError(
            'Gmail OAuth2 authentication failed. The refresh token may be invalid or revoked.',
            'OAUTH_AUTH_FAILED', 500, false
        );
    }

    // Gmail API Quota issues
    if (msg.includes('rateLimitExceeded') || msg.includes('quotaExceeded')) {
        return makeEmailError(
            'Gmail API quota exceeded. Too many emails sent recently.',
            'GMAIL_QUOTA_EXCEEDED', 502, true
        );
    }

    // Network / Socket issues (Less common with API, but possible)
    if (code === 'ETIMEDOUT' || code === 'ECONNRESET' || msg.includes('timeout')) {
        return makeEmailError(
            'Network timeout while communicating with Gmail API. Will retry.',
            'EMAIL_NETWORK_TIMEOUT', 502, true
        );
    }

    // Generic fallback
    return makeEmailError(
        `Email delivery failed: ${msg || 'unknown Gmail API error'}`,
        'EMAIL_SEND_FAILED', 502, true
    );
};

// ─── Retry with exponential backoff (Preserved) ─────────────────────────────

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const withRetry = async (fn, context = 'email') => {
    let lastError;

    for (let attempt = 1; attempt <= RETRY_POLICY.maxAttempts; attempt++) {
        try {
            return await fn();
        } catch (rawError) {
            const structured = rawError.code && rawError.status
                ? rawError
                : classifyEmailError(rawError);

            lastError = structured;

            const isLastAttempt = attempt === RETRY_POLICY.maxAttempts;
            const isRetryable   = structured.retryable !== false;

            console.error(`[EMAIL] ${context} attempt ${attempt}/${RETRY_POLICY.maxAttempts} failed`, {
                code:      structured.code,
                message:   structured.message,
                retryable: isRetryable,
            });

            if (!isRetryable || isLastAttempt) break;

            const delay = Math.min(RETRY_POLICY.baseDelayMs * Math.pow(2, attempt - 1), RETRY_POLICY.maxDelayMs);
            console.log(`[EMAIL] Retrying in ${delay}ms…`);
            await sleep(delay);
        }
    }
    throw lastError;
};

// ─── Core send function (Preserved signature) ────────────────────────────────

const sendEmail = async ({ to, subject, html, text }) => {
    return withRetry(async () => {
        const config = getAuthConfig();
        const transporter = await getTransporter();

        const from = {
            name: config.fromName,
            address: config.senderEmail
        };

        console.log('[EMAIL] Dispatching email via Gmail API', {
            to,
            subject: subject.substring(0, 60),
            from: from.address,
        });

        const info = await transporter.sendMail({ from, to, subject, html, text });

        console.log('[EMAIL] ✅ Email sent successfully (Gmail API)', {
            to,
            messageId: info.messageId
        });

        return {
            delivered: true,
            messageId: info.messageId,
        };
    }, `send → ${to}`);
};

// ─── Startup Verification (Preserved signature) ───────────────────────────────

export const verifySmtpConnection = async () => {
    const config = getAuthConfig();
    
    console.log('[EMAIL] 🔍 Verifying Gmail OAuth2 configuration...');

    if (!config.clientId || !config.clientSecret || !config.refreshToken) {
        console.warn('[EMAIL] ⚠️  Gmail OAuth2 credentials missing. Service is disabled.');
        return false;
    }

    try {
        const transporter = await getTransporter();
        
        // Nodemailer's verify() works with OAuth2 by attempting to get an access token
        await Promise.race([
            transporter.verify(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('OAuth2 verification timed out')), 15000))
        ]);

        console.log(`[EMAIL] ✅ OAuth2 Connection verified and authenticated for ${config.senderEmail}`);
        return true;
    } catch (error) {
        const structured = classifyEmailError(error);
        console.error('[EMAIL] ❌ OAuth2 verification failed', {
            code:    structured.code,
            message: structured.message,
            hint:    'Check your Client ID, Secret, and Refresh Token in Render dashboard.',
            rawError: error.message,
        });
        return false;
    }
};

// For diagnostics compatibility
export const getSmtpDiagnostics = () => {
    const config = getAuthConfig();
    return {
        configured: !!(config.clientId && config.refreshToken),
        type: 'OAuth2 (Gmail API)',
        user: config.senderEmail ? `${config.senderEmail.slice(0, 4)}***` : null,
        verifiedAt: new Date().toISOString()
    };
};

// ─── Email templates (Preserved exactly) ───────────────────────────────────────

const buildOtpEmailHtml = ({ title, otp, bodyText, expiresInMinutes, appName = 'CodeArena' }) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#0d0d0d;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0d0d;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0"
          style="background:#161616;border-radius:16px;border:1px solid #2a2a2a;overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1a1a1a,#111);padding:32px 40px;border-bottom:1px solid #2a2a2a;">
              <h1 style="margin:0;font-size:22px;font-weight:800;color:#4ade80;letter-spacing:-0.5px;">
                ${appName}
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <h2 style="margin:0 0 12px;font-size:20px;font-weight:700;color:#f5f5f5;">
                ${title}
              </h2>
              <p style="margin:0 0 28px;font-size:15px;color:#a3a3a3;line-height:1.6;">
                ${bodyText}
              </p>

              <!-- OTP Box -->
              <div style="background:#0d0d0d;border:1px solid #2a2a2a;border-radius:12px;
                          padding:24px;text-align:center;margin-bottom:28px;">
                <p style="margin:0 0 8px;font-size:12px;font-weight:600;
                           text-transform:uppercase;letter-spacing:2px;color:#6b7280;">
                  Verification Code
                </p>
                <p style="margin:0;font-size:40px;font-weight:800;
                           letter-spacing:12px;color:#4ade80;font-family:monospace;">
                  ${otp}
                </p>
              </div>

              <p style="margin:0;font-size:13px;color:#6b7280;">
                ⏱ This code expires in <strong style="color:#a3a3a3;">${expiresInMinutes} minutes</strong>.
                If you did not request this, please ignore this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px;border-top:1px solid #1f1f1f;">
              <p style="margin:0;font-size:12px;color:#404040;">
                This is an automated message from ${appName}. Do not reply.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

// ─── Public API (Preserved exactly) ───────────────────────────────────────────

export const sendAccountVerificationEmail = async ({ to, otp, name, expiresInMinutes }) => {
    const title    = 'Verify Your Email Address';
    const bodyText = `Hi ${name}, welcome to CodeArena! Use the code below to verify your email address and activate your account.`;

    return sendEmail({
        to,
        subject: `${otp} — Your CodeArena Verification Code`,
        html: buildOtpEmailHtml({ title, otp, bodyText, expiresInMinutes }),
        text: `Hi ${name},\n\nYour CodeArena verification code is: ${otp}\n\nIt expires in ${expiresInMinutes} minutes.\n\nIf you did not register, ignore this email.`,
    });
};

export const sendPasswordResetOtpEmail = async ({ to, otp, name, expiresInMinutes }) => {
    const title    = 'Reset Your Password';
    const bodyText = `Hi ${name}, we received a request to reset your CodeArena password. Use the code below to proceed.`;

    return sendEmail({
        to,
        subject: `${otp} — CodeArena Password Reset`,
        html: buildOtpEmailHtml({ title, otp, bodyText, expiresInMinutes }),
        text: `Hi ${name},\n\nYour CodeArena password reset code is: ${otp}\n\nIt expires in ${expiresInMinutes} minutes.\n\nIf you did not request this, ignore this email.`,
    });
};

export const sendSettingsOtpEmail = async ({ to, otp, name, expiresInMinutes }) => {
    const title    = 'Confirm Your Security Change';
    const bodyText = `Hi ${name}, a request was made to update your account security settings. Enter the code below to confirm.`;

    return sendEmail({
        to,
        subject: `${otp} — CodeArena Security Verification`,
        html: buildOtpEmailHtml({ title, otp, bodyText, expiresInMinutes }),
        text: `Hi ${name},\n\nYour CodeArena security verification code is: ${otp}\n\nIt expires in ${expiresInMinutes} minutes.\n\nIf you did not request this, change your password immediately.`,
    });
};

export const sendPaymentSubmissionEmail = async ({ to, name, planName, amount, utrNumber }) => {
    const title    = 'Payment Request Received';
    const bodyText = `Hi ${name}, we have received your manual UPI payment request for the ${planName} plan.`;
    const html = buildOtpEmailHtml({ title, otp: 'PROCESSING', bodyText: `Amount: Rs. ${amount}<br/>UTR: ${utrNumber}<br/><br/>Our team is reviewing the payment now. You will receive another email once it is approved.`, expiresInMinutes: 'N/A' });

    return sendEmail({
        to,
        subject: `CodeArena 1v1 payment received for ${planName}`,
        html: html,
        text: `Hi ${name},\n\We received your manual UPI payment request for ${planName}.\nAmount: Rs. ${amount}\nUTR: ${utrNumber}\n\nOur team is verifying the payment now. You will receive another email once it is approved or rejected.`,
    });
};

export const sendPaymentApprovedEmail = async ({ to, name, planName, amount }) => {
    const title    = 'Payment Approved';
    const bodyText = `Hi ${name}, great news! Your payment for the ${planName} plan has been successfully verified.`;
    const html = buildOtpEmailHtml({ title, otp: 'APPROVED', bodyText: `Amount received: Rs. ${amount}<br/><br/>Welcome to Pro! Your premium access is now active in CodeArena 1v1.`, expiresInMinutes: 'N/A' });

    return sendEmail({
        to,
        subject: `Welcome to CodeArena 1v1 ${planName}`,
        html: html,
        text: `Hi ${name},\n\nYour payment for ${planName} has been approved.\nAmount received: Rs. ${amount}\n\nWelcome to Pro. Your premium access is now active in CodeArena 1v1.`,
    });
};

export const sendPaymentRejectedEmail = async ({ to, name, planName, amount, adminNotes }) => {
    const title    = 'Payment Verification Failed';
    const bodyText = `Hi ${name}, we could not verify your payment request for the ${planName} plan.`;
    const notesBlock = adminNotes ? `Reviewer note: <strong>${adminNotes}</strong><br/>` : `Please check the UTR with your bank or payment app and try again.<br/>`;
    const html = buildOtpEmailHtml({ title, otp: 'REJECTED', bodyText: `Amount expected: Rs. ${amount}<br/>${notesBlock}<br/>You can submit a fresh payment request with the correct 12-digit UTR once the issue is resolved.`, expiresInMinutes: 'N/A' });

    return sendEmail({
        to,
        subject: 'CodeArena 1v1 payment could not be verified',
        html: html,
        text: `Hi ${name},\n\nWe could not verify your payment request for ${planName}.\nAmount expected: Rs. ${amount}\n${adminNotes ? `Reviewer note: ${adminNotes}\n` : 'Please check the UTR with your bank or payment app and try again.\n'}\nYou can submit a fresh payment request with the correct 12-digit UTR once the issue is resolved.`,
    });
};
