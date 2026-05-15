import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function verifySmtp() {
    console.log('--- SMTP ISOLATED TEST ---');
    console.log('User:', process.env.EMAIL_USER);
    console.log('Host:', process.env.EMAIL_HOST);
    console.log('Port:', process.env.EMAIL_PORT);
    
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT || '587', 10),
        secure: process.env.EMAIL_SECURE === 'true',
        family: 4,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
        tls: {
            rejectUnauthorized: false
        }
    });

    try {
        console.log('Verifying...');
        await transporter.verify();
        console.log('✅ SMTP SUCCESS: Transporter is ready');
        process.exit(0);
    } catch (error) {
        console.error('❌ SMTP FAILURE:', error.message);
        process.exit(1);
    }
}

verifySmtp();
