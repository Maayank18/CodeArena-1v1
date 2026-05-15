/**
 * authEmailService.js
 * Professional Nodemailer email service for Render-hosted backends.
 *
 * KEY DESIGN DECISIONS:
 *  - No persistent transporter: avoids stale-connection timeouts after cold starts
 *  - Gmail SMTP over port 587 (STARTTLS): works on Render (port 25 is blocked, 587/465 are not)
 *  - App Password auth: required since Google killed "Less Secure Apps"
 *  - Per-send transporter + verify(): catches dead connections before sending
 *  - Exponential-backoff retry: survives transient network hiccups
 *  - Structured error objects: status + code + retryable flag, consumed by controllers
 *  - IPv4 Enforcement: Prevents ENETUNREACH errors on cloud hosts without IPv6 routing to Gmail
 */

import nodemailer from 'nodemailer';
import dns from 'dns';

// ── CRITICAL FIX: Force Node.js to use IPv4 first ──
// This prevents the 'ENETUNREACH' error when trying to connect via IPv6 on Render/cloud hosts.
dns.setDefaultResultOrder('ipv4first');

// ─── Config ──────────────────────────────────────────────────────────────────

// ─── Config Helper ───────────────────────────────────────────────────────────
const parseEmailAddress = (email) => {
    if (!email || typeof email !== 'string') return null;
    
    email = email.trim();
    
    // Format: "Name <email@example.com>" or "Name <email@example.com"
    const angleMatch = email.match(/<?([a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})>?/);
    if (angleMatch && angleMatch[1]) {
        return angleMatch[1].trim();
    }
    
    // Plain email address
    if (email.includes('@')) {
        return email;
    }
    
    return null;
};

const getSmtpConfig = () => {
    const user = (process.env.EMAIL_USER || '').trim();
    const pass = (process.env.EMAIL_PASS || '').trim();
    const host = (process.env.EMAIL_HOST || 'smtp.gmail.com').trim();
    const port = parseInt(process.env.EMAIL_PORT || '587', 10);
    const secure = process.env.EMAIL_SECURE === 'true' || port === 465;
    
    // Parse EMAIL_FROM or fallback to EMAIL_USER
    let fromEmail = (process.env.EMAIL_FROM || process.env.EMAIL_USER || '').trim();
    if (fromEmail.startsWith('"') && fromEmail.endsWith('"')) {
        fromEmail = fromEmail.slice(1, -1).trim();
    }
    
    const parsedFromEmail = parseEmailAddress(fromEmail) || user;
    
    return {
        host,
        port,
        secure,
        user,
        pass,
        fromName: (process.env.EMAIL_FROM_NAME || 'CodeArena 1v1').trim(),
        fromEmail: parsedFromEmail,  // Always a valid email or empty
    };
};

// Retry policy
const RETRY_POLICY = {
    maxAttempts: 3,
    baseDelayMs: 800,   // first retry after ~0.8s
    maxDelayMs: 5000,   // cap at 5s
};

// Per-send timeouts (ms) — aggressive but fair for Render
const TRANSPORT_TIMEOUTS = {
    connectionTimeout: 10000,   // TCP connect
    greetingTimeout:   10000,   // SMTP banner
    socketTimeout:     15000,   // idle socket
};

// ─── Diagnostics (exposed via /health) ───────────────────────────────────────

let _smtpDiag = {
    configured: false,
    host: null,
    port: null,
    secure: null,
    user: null,
    verifiedAt: null,
    lastError: null,
};

export const getSmtpDiagnostics = () => ({ ..._smtpDiag });

// ─── Transporter factory ──────────────────────────────────────────────────────
// Returns a FRESH transporter every call.
// This is intentional: on Render's free tier the process may have been
// dormant for >15 min; any cached TCP connection will be dead.

const createTransporter = () => {
    const config = getSmtpConfig();
    if (!config.user || !config.pass) {
        throw makeSmtpError(
            'SMTP credentials are not configured. Set EMAIL_USER and EMAIL_PASS in your environment variables.',
            'SMTP_NOT_CONFIGURED',
            500,
            false   // not retryable — needs human action
        );
    }

    return nodemailer.createTransport({
        host:   config.host,
        port:   config.port,
        secure: config.secure,
        family: 4, // Force IPv4 to avoid ENETUNREACH on Render
        auth: {
            user: config.user,
            pass: config.pass,
        },
        // Per-call timeouts — prevents hangs
        connectionTimeout: TRANSPORT_TIMEOUTS.connectionTimeout,
        greetingTimeout:   TRANSPORT_TIMEOUTS.greetingTimeout,
        socketTimeout:     TRANSPORT_TIMEOUTS.socketTimeout,
        // Disable connection pooling — we create fresh transporters deliberately
        pool: false,
        // TLS options: stable across cloud hosts
        tls: {
            rejectUnauthorized: false,
            servername: config.host // Help with SNI
        },
    });
};

// ─── Structured error factory ─────────────────────────────────────────────────

const makeSmtpError = (message, code, status = 502, retryable = true) => {
    const err = new Error(message);
    err.code     = code;
    err.status   = status;
    err.retryable = retryable;
    return err;
};

// ─── Map raw nodemailer / OS errors → structured errors ──────────────────────

const classifySmtpError = (rawError) => {
    const msg     = rawError?.message || '';
    const errno   = rawError?.errno   || '';
    const code    = rawError?.code    || '';
    const responseCode = rawError?.responseCode || 0;

    // Auth failures — not retryable, need env var fix
    if (responseCode === 535 || /invalid login|username and password not accepted|authentication failed/i.test(msg)) {
        return makeSmtpError(
            'SMTP authentication failed. Check EMAIL_USER and EMAIL_PASS (Gmail requires an App Password, not your regular password).',
            'SMTP_AUTH_FAILED', 500, false
        );
    }

    // Network unreachable / refused — likely port blocked or wrong host
    if (code === 'ECONNREFUSED' || errno === 'ECONNREFUSED' || code === 'ENETUNREACH' || errno === 'ENETUNREACH') {
        return makeSmtpError(
            `SMTP connection refused/unreachable on ${getSmtpConfig().host}:${getSmtpConfig().port}. ` +
            'If using Render, port 25 is blocked — use port 587 (EMAIL_PORT=587) or 465.',
            'SMTP_CONNECTION_REFUSED', 502, false
        );
    }

    // DNS resolution failure — wrong EMAIL_HOST
    if (code === 'ENOTFOUND' || errno === 'ENOTFOUND') {
        return makeSmtpError(
            `SMTP host not found: "${getSmtpConfig().host}". Check your EMAIL_HOST environment variable.`,
            'SMTP_HOST_NOT_FOUND', 502, false
        );
    }

    // Timeout — transient, retryable
    if (code === 'ETIMEDOUT' || errno === 'ETIMEDOUT' || /timeout/i.test(msg)) {
        return makeSmtpError(
            'SMTP connection timed out. This is usually transient — the request will be retried.',
            'SMTP_TIMEOUT', 502, true
        );
    }

    // Recipient rejected
    if (responseCode === 550 || responseCode === 553) {
        return makeSmtpError(
            'The recipient email address was rejected by the SMTP server.',
            'SMTP_RECIPIENT_REJECTED', 400, false
        );
    }

    // Rate limited by SMTP provider
    if (responseCode === 421 || responseCode === 450) {
        return makeSmtpError(
            'SMTP server is temporarily unavailable or rate-limiting. Will retry.',
            'SMTP_RATE_LIMITED', 502, true
        );
    }

    // Generic fallback
    return makeSmtpError(
        `Email delivery failed: ${msg || 'unknown SMTP error'}`,
        'SMTP_SEND_FAILED', 502, true
    );
};

// ─── Retry with exponential backoff ──────────────────────────────────────────

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const withRetry = async (fn, context = 'email') => {
    let lastError;

    for (let attempt = 1; attempt <= RETRY_POLICY.maxAttempts; attempt++) {
        try {
            return await fn();
        } catch (rawError) {
            const structured = rawError.code && rawError.status
                ? rawError                          // already classified
                : classifySmtpError(rawError);      // classify raw nodemailer error

            lastError = structured;

            const isLastAttempt = attempt === RETRY_POLICY.maxAttempts;
            const isRetryable   = structured.retryable !== false;

            console.error(`[EMAIL] ${context} attempt ${attempt}/${RETRY_POLICY.maxAttempts} failed`, {
                code:      structured.code,
                message:   structured.message,
                retryable: isRetryable,
            });

            if (!isRetryable || isLastAttempt) {
                break;
            }

            // Exponential backoff: 800ms, 1600ms, 3200ms … capped at 5000ms
            const delay = Math.min(
                RETRY_POLICY.baseDelayMs * Math.pow(2, attempt - 1),
                RETRY_POLICY.maxDelayMs
            );
            console.log(`[EMAIL] Retrying in ${delay}ms…`);
            await sleep(delay);
        }
    }

    throw lastError;
};

// ─── Core send function ───────────────────────────────────────────────────────

const sendEmail = async ({ to, subject, html, text }) => {
    return withRetry(async () => {
        const config = getSmtpConfig();
        
        // Validate from address before attempting to send
        if (!config.fromEmail || !config.fromEmail.includes('@')) {
            throw makeSmtpError(
                `Invalid sender email address: "${config.fromEmail}". Set EMAIL_FROM or EMAIL_USER environment variable to a valid email address.`,
                'SMTP_INVALID_FROM_ADDRESS',
                500,
                false
            );
        }
        
        const transporter = createTransporter();

        // Verify the connection BEFORE trying to send.
        // This surfaces auth/host/port problems immediately with a clear error
        // rather than letting them manifest as a cryptic timeout.
        try {
            await transporter.verify();
        } catch (verifyError) {
            const classified = classifySmtpError(verifyError);
            console.error('[EMAIL] SMTP verification failed before sending', {
                code: classified.code,
                message: classified.message,
                host: config.host,
                port: config.port,
                user: config.user ? `${config.user.slice(0, 4)}***` : 'not-set',
            });
            throw classified;
        }

        // Construct the 'from' field as an object to prevent header injection/mangling
        const from = {
            name: config.fromName,
            address: config.fromEmail
        };

        console.log('[EMAIL] Sending email', {
            to,
            subject: subject.substring(0, 60),
            from: from.address,
            fromName: from.name,
        });

        const info = await transporter.sendMail({ from, to, subject, html, text });

        // Close transport immediately — no lingering TCP connections
        transporter.close();

        _smtpDiag.verifiedAt = new Date().toISOString();
        _smtpDiag.lastError  = null;

        return {
            delivered:  true,
            messageId:  info.messageId,
            // In dev, expose the OTP preview URL (Ethereal / nodemailer test accounts)
            debug: process.env.NODE_ENV !== 'production'
                ? { previewUrl: nodemailer.getTestMessageUrl(info) || null }
                : undefined,
        };
    }, `send → ${to}`);
};

// ─── Startup SMTP verification ────────────────────────────────────────────────
// Called once from server.js startServer(). Logs clearly and never crashes the
// server — email is important but not worth killing startup over.

export const verifySmtpConnection = async () => {
    const config = getSmtpConfig();
    
    // Check if credentials are present
    const hasUser = Boolean(config.user && config.user.length > 0);
    const hasPass = Boolean(config.pass && config.pass.length > 0);
    const hasFromEmail = Boolean(config.fromEmail && config.fromEmail.includes('@'));
    
    _smtpDiag = {
        configured: hasUser && hasPass && hasFromEmail,
        host:       config.host,
        port:       config.port,
        secure:     config.secure,
        user:       config.user ? `${config.user.slice(0, 4)}***` : null,
        fromEmail:  config.fromEmail || null,
        verifiedAt: null,
        lastError:  null,
    };

    // Early exit if credentials missing
    if (!hasUser || !hasPass) {
        console.warn('[SMTP] ⚠️  SMTP Authentication credentials missing', {
            hasEmailUser: hasUser,
            hasEmailPass: hasPass,
            hint: 'Set EMAIL_USER and EMAIL_PASS in your environment variables (e.g., Render → Environment tab)'
        });
        _smtpDiag.lastError = { 
            code: 'SMTP_NOT_CONFIGURED', 
            message: 'EMAIL_USER and/or EMAIL_PASS not set' 
        };
        return false;
    }
    
    if (!hasFromEmail) {
        console.warn('[SMTP] ⚠️  Sender email address invalid', {
            emailFrom: process.env.EMAIL_FROM || 'not-set',
            emailUser: config.user ? `${config.user.slice(0, 4)}***` : 'not-set',
            hint: 'Set EMAIL_FROM or EMAIL_USER to a valid email address'
        });
        _smtpDiag.lastError = { 
            code: 'SMTP_INVALID_FROM_ADDRESS', 
            message: `Invalid from address: "${config.fromEmail}"` 
        };
        return false;
    }

    try {
        const transporter = createTransporter();
        
        // Wrap verify in a promise race to prevent startup hanging forever
        await Promise.race([
            transporter.verify(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('SMTP Verification timed out after 15s')), 15000))
        ]);
        
        transporter.close();

        _smtpDiag.verifiedAt = new Date().toISOString();
        console.log(`[SMTP] ✅ Connection verified and authenticated`, {
            host: config.host,
            port: config.port,
            secure: config.secure,
            user: `${config.user.slice(0, 4)}***`,
            fromEmail: config.fromEmail,
        });
        return true;
    } catch (error) {
        const structured = classifySmtpError(error);
        _smtpDiag.lastError = { code: structured.code, message: structured.message };

        console.error('[SMTP] ❌ Startup verification failed', {
            code:    structured.code,
            message: structured.message,
            host: config.host,
            port: config.port,
            user: `${config.user.slice(0, 4)}***`,
            hint:    getHint(structured.code),
            rawError: error.message,
        });

        // Not fatal — server continues, but emails will fail until fixed
        return false;
    }
};

const getHint = (code) => {
    const config = getSmtpConfig();
    return {
        SMTP_NOT_CONFIGURED:     'Set EMAIL_USER and EMAIL_PASS in Render → Environment',
        SMTP_AUTH_FAILED:        'Gmail requires an App Password. Go to myaccount.google.com/apppasswords',
        SMTP_CONNECTION_REFUSED: 'Change EMAIL_PORT to 587 and EMAIL_SECURE to false in Render env vars',
        SMTP_HOST_NOT_FOUND:     `Check EMAIL_HOST — should be smtp.gmail.com for Gmail (current: ${config.host})`,
        SMTP_TIMEOUT:            'Transient. Will retry on next send. Check Render network settings if persistent.',
    }[code] || 'Check EMAIL_* environment variables';
};

// ─── Email templates ──────────────────────────────────────────────────────────

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

// ─── Public API ───────────────────────────────────────────────────────────────

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

// Payment Email Exports ─────────────────────────────────────────────────────────

export const sendPaymentSubmissionEmail = async ({ to, name, planName, amount, utrNumber }) => {
    const title    = 'Payment Request Received';
    const bodyText = `Hi ${name}, we have received your manual UPI payment request for the ${planName} plan.`;
    
    // We reuse the basic HTML structure without the OTP box by modifying the template manually
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
