import nodemailer from 'nodemailer';

let cachedTransporter = null;

const hasSmtpConfig = () => {
    return Boolean(
        process.env.SMTP_HOST &&
        process.env.SMTP_PORT &&
        process.env.SMTP_USER &&
        process.env.SMTP_PASS &&
        process.env.SMTP_FROM
    );
};

const getTransporter = () => {
    if (!hasSmtpConfig()) {
        return null;
    }

    if (!cachedTransporter) {
        cachedTransporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    }

    return cachedTransporter;
};

export const sendPasswordResetOtpEmail = async ({ to, otp, name, expiresInMinutes }) => {
    const transporter = getTransporter();
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

    if (!transporter) {
        if (process.env.NODE_ENV === 'production') {
            throw new Error('SMTP is not configured for password reset emails');
        }

        console.log(`[AUTH OTP][DEV] ${to} -> ${otp}`);
        return { delivered: false, debug: true };
    }

    await transporter.sendMail({
        from: process.env.SMTP_FROM,
        to,
        subject,
        html,
    });

    return { delivered: true, debug: false };
};

export const sendSettingsOtpEmail = async ({ to, otp, name, expiresInMinutes, requestedChanges = [] }) => {
    const transporter = getTransporter();
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

    if (!transporter) {
        if (process.env.NODE_ENV === 'production') {
            throw new Error('SMTP is not configured for settings verification emails');
        }

        console.log(`[SETTINGS OTP][DEV] ${to} -> ${otp}`);
        return { delivered: false, debug: true };
    }

    await transporter.sendMail({
        from: process.env.SMTP_FROM,
        to,
        subject,
        html,
    });

    return { delivered: true, debug: false };
};
