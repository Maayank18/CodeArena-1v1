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
