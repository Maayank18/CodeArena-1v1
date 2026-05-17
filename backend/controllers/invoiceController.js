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

/**
 * Internal helper to find or create an invoice record for a transaction.
 */
export const getOrCreateInvoice = async (transaction, user) => {
    let invoice = await Invoice.findOne({ transactionId: transaction._id });
    
    if (!invoice) {
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
        const invoiceId = `CA-INV-${dateStr}-${randomStr}`;

        const planPrices = { plus: 49, pro: 99, premium: 149 };
        const planId = (transaction.planId || user.subscriptionPlan || 'pro').toLowerCase().trim();
        const amountPaid = planPrices[planId] || transaction.amount || 99;

        invoice = await Invoice.create({
            invoiceId,
            transactionId: transaction._id,
            userId: user._id,
            amount: amountPaid,
            planName: transaction.planName,
            issuedAt: transaction.reviewedAt || new Date()
        });
    }
    return invoice;
};

export const generateInvoicePDF = async (req, res) => {
    try {
        const { transactionId } = req.params;

        if (!mongoose.isValidObjectId(transactionId)) {
            return res.status(400).json({ success: false, message: 'Invalid transaction ID' });
        }

        // Fetch transaction and populate the userId field to get name and email
        const transaction = await PaymentTransaction.findById(transactionId).populate('userId').lean();
        if (!transaction) {
            return res.status(404).json({ success: false, message: 'Transaction not found' });
        }

        if (transaction.userId._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Unauthorized to view this invoice' });
        }

        if (transaction.status !== 'approved') {
            return res.status(400).json({ success: false, message: 'Invoice is only available for approved transactions' });
        }

        const userObj = transaction.userId || {};
        const userName = userObj.fullName || userObj.username || 'User';
        const userEmail = userObj.email || '';
        const userPhone = userObj.phone || 'N/A';
        const userIdVal = `CA-USER-${userObj._id ? userObj._id.toString().slice(-6).toUpperCase() : 'N/A'}`;

        // Use helper to get or create invoice
        const invoice = await getOrCreateInvoice(transaction, userObj);

        // Enforce exact pricing mapping at PDF level to fix any historic base amount mismatches
        const planPrices = { plus: 49, pro: 99, premium: 149 };
        const planId = (transaction.planId || 'pro').toLowerCase().trim();
        const correctAmount = planPrices[planId] || transaction.amount || 99;

        // Generate PDF Document
        const doc = new PDFDocument({ margin: 50, size: 'A4' });

        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="Invoice_${invoice.invoiceId}.pdf"`);

        // Pipe directly to response
        doc.pipe(res);

        // --- DESIGN SYSTEM / STYLING PALETTE ---
        const colors = {
            primary: '#10b981',       // Emerald Mint
            primaryDark: '#059669',   // Emerald Dark
            indigo: '#4f46e5',        // Indigo Blue
            indigoLight: '#e0e7ff',   // Indigo BG Tint
            bgCard: '#f8fafc',        // Card Fill
            border: '#e2e8f0',        // Card Border
            textMain: '#0f172a',      // Primary Text
            textSub: '#475569',       // Secondary Text
            textMuted: '#94a3b8',     // Muted Gray Text
            white: '#ffffff'
        };

        // ─── 1. HEADER SECTION ───────────────────────────────────────────────
        // Company Brand Logo & Name
        if (fs.existsSync(LOGO_PATH)) {
            doc.image(LOGO_PATH, 50, 40, { width: 55, height: 55 });
        } else {
            // Fallback text if logo file is missing
            doc.fontSize(22)
               .font('Helvetica-Bold')
               .fillColor(colors.indigo)
               .text('CodeArena 1v1', 50, 40);
        }

        doc.fontSize(20)
           .font('Helvetica-Bold')
           .fillColor(colors.textMain)
           .text('CodeArena 1v1', 115, 45);

        doc.fontSize(9)
           .font('Helvetica-Oblique')
           .fillColor(colors.textSub)
           .text('Where Every Challenge Makes You Stronger', 115, 68);

        // Invoice / Bill Right-Aligned Badge & Details
        const headerRightX = 380;
        doc.fillColor(colors.indigoLight)
           .strokeColor(colors.indigo)
           .lineWidth(1)
           .roundedRect(headerRightX, 42, 165, 22, 6)
           .fillAndStroke();

        doc.fontSize(9)
           .font('Helvetica-Bold')
           .fillColor(colors.indigo)
           .text('INVOICE / BILL', headerRightX, 48, { width: 165, align: 'center' });

        doc.fontSize(8.5)
           .font('Helvetica-Bold')
           .fillColor(colors.textSub)
           .text('Invoice ID', headerRightX, 75)
           .font('Helvetica')
           .fillColor(colors.textMain)
           .text(`:  ${invoice.invoiceId}`, headerRightX + 60, 75);

        doc.font('Helvetica-Bold')
           .fillColor(colors.textSub)
           .text('Invoice Date', headerRightX, 90)
           .font('Helvetica')
           .fillColor(colors.textMain)
           .text(`:  ${new Date(invoice.issuedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}`, headerRightX + 60, 90);

        doc.font('Helvetica-Bold')
           .fillColor(colors.textSub)
           .text('Invoice Time', headerRightX, 105)
           .font('Helvetica')
           .fillColor(colors.textMain)
           .text(`:  ${new Date(invoice.issuedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`, headerRightX + 60, 105);

        // Separate header line
        doc.moveTo(50, 125)
           .lineTo(545, 125)
           .strokeColor(colors.border)
           .lineWidth(1)
           .stroke();

        // ─── 2. DUAL CARD GRID SECTION (BILLED TO & PLAN DETAILS) ────────────
        const cardY = 142;
        const cardH = 145;
        const cardW = 235;

        // Card 1: Billed To Card
        doc.fillColor(colors.bgCard)
           .strokeColor(colors.border)
           .lineWidth(1)
           .roundedRect(50, cardY, cardW, cardH, 12)
           .fillAndStroke();

        doc.fontSize(9.5)
           .font('Helvetica-Bold')
           .fillColor(colors.indigo)
           .text('BILLED TO', 65, cardY + 15);

        // Billed details list
        const drawDetailRow = (lbl, val, x, y) => {
            doc.fontSize(8.5)
               .font('Helvetica-Bold')
               .fillColor(colors.textSub)
               .text(lbl, x, y)
               .font('Helvetica')
               .fillColor(colors.textMain)
               .text(`:   ${val}`, x + 50, y, { width: cardW - 75, height: 15, ellipsis: true });
        };

        drawDetailRow('Name', userName, 65, cardY + 38);
        drawDetailRow('Email', userEmail, 65, cardY + 58);
        drawDetailRow('User ID', userIdVal, 65, cardY + 78);
        drawDetailRow('Phone', userPhone, 65, cardY + 98);

        // Card 2: Subscription Plan Details Card
        doc.fillColor(colors.bgCard)
           .strokeColor(colors.border)
           .lineWidth(1)
           .roundedRect(310, cardY, cardW, cardH, 12)
           .fillAndStroke();

        doc.fontSize(9.5)
           .font('Helvetica-Bold')
           .fillColor(colors.indigo)
           .text('COURSE PLAN DETAILS', 325, cardY + 15);

        // Indigo inner pill for the Plan badge
        doc.fillColor(colors.indigoLight)
           .roundedRect(325, cardY + 35, 205, 42, 8)
           .fill();

        doc.fontSize(10.5)
           .font('Helvetica-Bold')
           .fillColor(colors.indigo)
           .text(`${planId.toUpperCase()} PLAN`, 340, cardY + 44);

        doc.fontSize(7.5)
           .font('Helvetica-Bold')
           .fillColor(colors.indigo)
           .text('TOP RATED', 340, cardY + 59);

        // Plan detail rows inside the card
        const expiryDateObj = new Date(invoice.issuedAt);
        expiryDateObj.setDate(expiryDateObj.getDate() + 30);

        const drawPlanRow = (lbl, val, y) => {
            doc.fontSize(8.5)
               .font('Helvetica-Bold')
               .fillColor(colors.textSub)
               .text(lbl, 325, y)
               .font('Helvetica')
               .fillColor(colors.textMain)
               .text(`:   ${val}`, 325 + 60, y);
        };

        drawPlanRow('Validity', '1 Month', cardY + 90);
        drawPlanRow('Start Date', new Date(invoice.issuedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }), cardY + 105);
        drawPlanRow('End Date', expiryDateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }), cardY + 120);

        // ─── 3. PLAN FEATURES CHECKLIST SECTION ─────────────────────────────
        const featuresY = 302;
        const featuresH = 110;

        doc.fillColor(colors.bgCard)
           .strokeColor(colors.border)
           .lineWidth(1)
           .roundedRect(50, featuresY, 495, featuresH, 12)
           .fillAndStroke();

        doc.fontSize(9.5)
           .font('Helvetica-Bold')
           .fillColor(colors.indigo)
           .text('PLAN FEATURES', 65, featuresY + 15);

        // Define plan features list
        const planFeaturesMap = {
            plus: [
                'Access to persistent Spiral Notebook',
                '3 AI Code Assist & Hints per day',
                'Custom Battle Arena matchmaking access',
                'Complete campaign path & progress tracking'
            ],
            pro: [
                '6 AI Code Assist & Hints per day',
                'Everything included in Plus membership',
                'Custom room creation with advanced tools',
                'Unlock exclusive profile customization & frames'
            ],
            premium: [
                '15 AI Code Assist & Hints per day',
                'Everything included in Pro membership',
                'VIP priority matchmaking queue & direct line',
                'Unlock full visualizers & premium badge assets'
            ]
        };

        const features = planFeaturesMap[planId] || planFeaturesMap.pro;

        // Draw bullet/checklist items
        features.forEach((feat, index) => {
            const col = index % 2; // 0 or 1
            const row = Math.floor(index / 2); // 0 or 1
            const featX = 65 + col * 240;
            const featY = featuresY + 40 + row * 24;

            // Cute small checkbox/checkmark shape
            doc.strokeColor(colors.primary)
               .lineWidth(1.5)
               .moveTo(featX, featY + 4)
               .lineTo(featX + 3, featY + 7)
               .lineTo(featX + 8, featY + 1)
               .stroke();

            doc.fontSize(8.5)
               .font('Helvetica')
               .fillColor(colors.textSub)
               .text(feat, featX + 15, featY, { width: 215, height: 18, ellipsis: true });
        });

        // ─── 4. PAYMENT & TRANSACTION DETAIL COLUMNS ──────────────────────────
        const bottomY = 427;
        const bottomH = 130;

        // Left Card: Payment details
        doc.fillColor(colors.bgCard)
           .strokeColor(colors.border)
           .lineWidth(1)
           .roundedRect(50, bottomY, cardW, bottomH, 12)
           .fillAndStroke();

        doc.fontSize(9.5)
           .font('Helvetica-Bold')
           .fillColor(colors.primaryDark)
           .text('PAYMENT / TRANSACTION DETAILS', 65, bottomY + 15);

        const drawPaymentRow = (lbl, val, y) => {
            doc.fontSize(8.5)
               .font('Helvetica-Bold')
               .fillColor(colors.textSub)
               .text(lbl, 65, y)
               .font('Helvetica')
               .fillColor(colors.textMain)
               .text(`:   ${val}`, 65 + 75, y, { width: cardW - 95, ellipsis: true });
        };

        drawPaymentRow('Transaction ID', `TXN-${transaction._id.toString().slice(-8).toUpperCase()}`, bottomY + 38);
        drawPaymentRow('Payment Method', 'UPI', bottomY + 58);
        drawPaymentRow('Payment Date', new Date(invoice.issuedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }), bottomY + 78);
        drawPaymentRow('UTR Number', transaction.utrNumber, bottomY + 98);

        // Right Card: Amount Details
        doc.fillColor(colors.bgCard)
           .strokeColor(colors.border)
           .lineWidth(1)
           .roundedRect(310, bottomY, cardW, bottomH, 12)
           .fillAndStroke();

        doc.fontSize(9.5)
           .font('Helvetica-Bold')
           .fillColor(colors.primaryDark)
           .text('AMOUNT DETAILS', 325, bottomY + 15);

        doc.fontSize(9)
           .font('Helvetica-Bold')
           .fillColor(colors.textSub)
           .text('Plan Amount', 325, bottomY + 42)
           .font('Helvetica')
           .fillColor(colors.textMain)
           .text(`Rs. ${correctAmount.toFixed(2)}`, 440, bottomY + 42, { align: 'right', width: 90 });

        doc.fontSize(9)
           .font('Helvetica-Bold')
           .fillColor(colors.textSub)
           .text('Tax (GST)', 325, bottomY + 58)
           .font('Helvetica')
           .fillColor(colors.textMain)
           .text('Rs. 0.00', 440, bottomY + 58, { align: 'right', width: 90 });

        // Line divider inside the amount card
        doc.moveTo(325, bottomY + 80)
           .lineTo(530, bottomY + 80)
           .strokeColor(colors.border)
           .lineWidth(0.8)
           .stroke();

        doc.fontSize(10.5)
           .font('Helvetica-Bold')
           .fillColor(colors.textMain)
           .text('Total Amount', 325, bottomY + 95);

        doc.fontSize(14)
           .font('Helvetica-Bold')
           .fillColor(colors.primaryDark)
           .text(`Rs. ${correctAmount.toFixed(2)}`, 415, bottomY + 92, { align: 'right', width: 115 });

        // ─── 5. FOOTER & CEO SIGNATURE SECTION ─────────────────────────────
        const footerY = 575;
        const sigX = 380;

        // Left Column: Thank you note & CEO Title
        doc.fontSize(9.5)
           .font('Helvetica')
           .fillColor(colors.textSub)
           .text('Thank you,', 50, footerY + 15);

        doc.fontSize(11)
           .font('Helvetica-Bold')
           .fillColor(colors.indigo)
           .text('Mayank Garg', 50, footerY + 28);

        doc.fontSize(8.5)
           .font('Helvetica')
           .fillColor(colors.textSub)
           .text('CEO, CodeArena 1v1', 50, footerY + 41);

        // Right Column: CEO Signature & Line
        if (fs.existsSync(SIGNATURE_PATH)) {
            doc.image(SIGNATURE_PATH, sigX + 15, footerY + 5, { width: 100, height: 35 });
        } else {
            // Backup beautiful script text if signature image is not found
            doc.fontSize(12)
               .font('Helvetica-Bold')
               .fillColor(colors.indigo)
               .text('Mayank Garg', sigX + 15, footerY + 15);
        }

        // Horizontal line under signature
        doc.moveTo(sigX, footerY + 45)
           .lineTo(sigX + 130, footerY + 45)
           .strokeColor(colors.border)
           .lineWidth(1)
           .stroke();

        doc.fontSize(8)
           .font('Helvetica')
           .fillColor(colors.textSub)
           .text('Authorized Signature', sigX, footerY + 52, { width: 130, align: 'center' });

        // Horizontal divider line above contact strip
        doc.moveTo(50, 715)
           .lineTo(545, 715)
           .strokeColor(colors.border)
           .lineWidth(0.8)
           .stroke();

        // ─── 6. CLEAN PLAIN TEXT CONTACT STRIP (NO SCRAMBLED UTF-8 EMOJIS) ─────────────────
        doc.fontSize(8.5)
           .font('Helvetica-Bold')
           .fillColor(colors.textSub)
           .text('www.codearena1v1.com    |    support@codearena1v1.com    |    India', 50, 730, { width: 495, align: 'center' });

        doc.fontSize(8)
           .font('Helvetica')
           .fillColor(colors.textMuted)
           .text('Thank you for choosing CodeArena 1v1! Keep coding and climbing the ranks.', 50, 745, { width: 495, align: 'center' });

        // Finalize PDF Document
        doc.end();

    } catch (error) {
        console.error('GENERATE INVOICE ERROR:', error);
        if (!res.headersSent) {
            res.status(500).json({ success: false, message: 'Failed to generate invoice' });
        }
    }
};
