import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import PDFDocument from 'pdfkit';
import mongoose from 'mongoose';
import PaymentTransaction from '../models/PaymentTransaction.js';
import User from '../models/User.js';
import Invoice from '../models/Invoice.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Assets paths
const ASSETS_DIR = path.join(__dirname, '../../frontend/src/assets');
const LOGO_PATH = path.join(ASSETS_DIR, 'CodeArenaLogo.png');
const SIGNATURE_PATH = path.join(ASSETS_DIR, 'Signature.png');

export const generateInvoicePDF = async (req, res) => {
    try {
        const { transactionId } = req.params;

        if (!mongoose.isValidObjectId(transactionId)) {
            return res.status(400).json({ success: false, message: 'Invalid transaction ID' });
        }

        const transaction = await PaymentTransaction.findById(transactionId).lean();
        if (!transaction) {
            return res.status(404).json({ success: false, message: 'Transaction not found' });
        }

        if (transaction.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Unauthorized to view this invoice' });
        }

        if (transaction.status !== 'approved') {
            return res.status(400).json({ success: false, message: 'Invoice is only available for approved transactions' });
        }

        const user = await User.findById(req.user._id).select('fullName username email phone').lean();

        // Find or create Invoice record
        let invoice = await Invoice.findOne({ transactionId });
        
        if (!invoice) {
            // Generate a unique invoice ID: CA-INV-YYYYMMDD-XXXX
            const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
            const invoiceId = `CA-INV-${dateStr}-${randomStr}`;

            invoice = await Invoice.create({
                invoiceId,
                transactionId: transaction._id,
                userId: user._id,
                amount: transaction.amount,
                planName: transaction.planName,
                issuedAt: transaction.reviewedAt || new Date()
            });
        }

        // Generate PDF
        const doc = new PDFDocument({ margin: 50, size: 'A4' });

        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="Invoice_${invoice.invoiceId}.pdf"`);

        // Pipe directly to response
        doc.pipe(res);

        // --- STYLES & COLORS ---
        const colors = {
            primary: '#10b981', // Emerald 500
            secondary: '#3b82f6', // Blue 500
            textMain: '#111827', // Gray 900
            textMuted: '#6b7280', // Gray 500
            bgLight: '#f9fafb', // Gray 50
            border: '#e5e7eb' // Gray 200
        };

        // Add a subtle background color
        doc.rect(0, 0, doc.page.width, doc.page.height).fill(colors.bgLight);

        // --- HEADER ---
        doc.fill(colors.textMain);
        
        if (fs.existsSync(LOGO_PATH)) {
            doc.image(LOGO_PATH, 50, 45, { width: 120 });
        } else {
            doc.fontSize(24).font('Helvetica-Bold').text('CodeArena 1v1', 50, 50);
        }

        doc.fontSize(28)
           .font('Helvetica-Bold')
           .fillColor(colors.primary)
           .text('INVOICE', 50, 50, { align: 'right' });
        
        doc.fontSize(10)
           .font('Helvetica')
           .fillColor(colors.textMuted)
           .text(`Invoice Number: ${invoice.invoiceId}`, 50, 85, { align: 'right' })
           .text(`Date Issued: ${new Date(invoice.issuedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 50, 100, { align: 'right' })
           .text(`Status: PAID (Verified)`, 50, 115, { align: 'right' });

        doc.moveDown(3);

        // --- COMPANY & BILLING DETAILS ---
        const topY = doc.y + 10;
        
        // Company Details
        doc.fontSize(12).font('Helvetica-Bold').fillColor(colors.textMain).text('From:', 50, topY);
        doc.fontSize(10).font('Helvetica').fillColor(colors.textMuted)
           .text('CodeArena 1v1', 50, topY + 20)
           .text('contact@codearena1v1.com', 50, topY + 35)
           .text('https://codearena1v1.com', 50, topY + 50);

        // Customer Details
        doc.fontSize(12).font('Helvetica-Bold').fillColor(colors.textMain).text('Billed To:', 300, topY);
        doc.fontSize(10).font('Helvetica').fillColor(colors.textMuted)
           .text(user.fullName || user.username, 300, topY + 20)
           .text(user.email, 300, topY + 35)
           .text(user.phone || 'N/A', 300, topY + 50);

        doc.moveDown(4);

        // --- TRANSACTION DETAILS ---
        const tableTop = doc.y + 20;

        // Draw Table Header
        doc.rect(50, tableTop, 495, 30).fillColor(colors.primary).fill();
        
        doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(10)
           .text('DESCRIPTION', 65, tableTop + 10)
           .text('PAYMENT MODE', 250, tableTop + 10)
           .text('VALIDITY', 350, tableTop + 10)
           .text('AMOUNT', 0, tableTop + 10, { align: 'right', width: 530 });

        // Draw Table Row
        const rowY = tableTop + 40;
        doc.fillColor(colors.textMain).font('Helvetica').fontSize(10)
           .text(`${invoice.planName} Membership`, 65, rowY)
           .text('UPI (Manual UTR)', 250, rowY)
           .text('1 Month', 350, rowY)
           .text(`Rs. ${invoice.amount.toFixed(2)}`, 0, rowY, { align: 'right', width: 530 });

        doc.fontSize(8).fillColor(colors.textMuted)
           .text(`UTR: ${transaction.utrNumber}`, 65, rowY + 15);

        // Draw line under row
        doc.moveTo(50, rowY + 40).lineTo(545, rowY + 40).strokeColor(colors.border).stroke();

        // --- TOTALS ---
        const totalY = rowY + 60;
        doc.fontSize(10).font('Helvetica-Bold').fillColor(colors.textMain)
           .text('Subtotal:', 350, totalY)
           .font('Helvetica').text(`Rs. ${invoice.amount.toFixed(2)}`, 0, totalY, { align: 'right', width: 530 });

        doc.font('Helvetica-Bold').text('Tax (GST):', 350, totalY + 20)
           .font('Helvetica').text('Rs. 0.00', 0, totalY + 20, { align: 'right', width: 530 });

        // Draw line for total
        doc.moveTo(350, totalY + 40).lineTo(545, totalY + 40).strokeColor(colors.border).stroke();

        doc.fontSize(14).font('Helvetica-Bold').fillColor(colors.primary)
           .text('Total Paid:', 350, totalY + 55)
           .text(`Rs. ${invoice.amount.toFixed(2)}`, 0, totalY + 55, { align: 'right', width: 530 });

        // --- FEATURES SUMMARY (Optional touch) ---
        doc.moveDown(6);
        const featuresY = doc.y;
        doc.fontSize(10).font('Helvetica-Bold').fillColor(colors.textMain).text('Membership Features:', 50, featuresY);
        doc.fontSize(9).font('Helvetica').fillColor(colors.textMuted)
           .text('• Premium matchmaking and 1v1 arenas', 50, featuresY + 15)
           .text('• Priority support and custom battle rooms', 50, featuresY + 30)
           .text('• Advanced analytics and progression tracking', 50, featuresY + 45);

        // --- AUTHORIZATION / SIGNATURE ---
        const signatureY = doc.page.height - 150;
        
        if (fs.existsSync(SIGNATURE_PATH)) {
            doc.image(SIGNATURE_PATH, 400, signatureY - 40, { width: 100 });
        }
        
        doc.moveTo(400, signatureY + 10).lineTo(500, signatureY + 10).strokeColor(colors.textMain).stroke();
        doc.fontSize(10).font('Helvetica-Bold').fillColor(colors.textMain).text('Mayank Garg', 400, signatureY + 20, { width: 100, align: 'center' });
        doc.fontSize(9).font('Helvetica').fillColor(colors.textMuted).text('CEO, CodeArena 1v1', 400, signatureY + 35, { width: 100, align: 'center' });

        // --- FOOTER ---
        doc.fontSize(10).font('Helvetica-Oblique').fillColor(colors.textMuted)
           .text('Thank you for choosing CodeArena 1v1! Keep coding and climbing the ranks.', 50, doc.page.height - 50, { align: 'center', width: 495 });

        // Finalize PDF
        doc.end();

    } catch (error) {
        console.error('GENERATE INVOICE ERROR:', error);
        if (!res.headersSent) {
            res.status(500).json({ success: false, message: 'Failed to generate invoice' });
        }
    }
};
