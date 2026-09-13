/**
 * TECTO MARK — Service Inquiry Backend Server
 * Production-grade lead-capture pipeline with SQLite persistence,
 * rate limiting, spam honeypot filtering, and dual transactional email dispatch.
 */

require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const nodemailer = require('nodemailer');
const Database = require('better-sqlite3');
const multer = require('multer');

// ── Multer config: save directly to assets/team/ with original name ──
const teamUpload = multer({
  storage: multer.diskStorage({
    destination: path.join(__dirname, 'assets', 'team'),
    filename: (req, file, cb) => {
      // Use the fieldname (e.g. "anoop-shukla") + detected extension
      const ext = path.extname(file.originalname) || '.jpg';
      cb(null, req.body.slug ? req.body.slug + ext : file.originalname);
    }
  }),
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only images allowed'));
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10 MB
});

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'tectomarksupport@gmail.com';
const ADMIN_KEY = process.env.ADMIN_KEY || 'tectomark-secret-key';

// ── Middleware ──────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// Trust proxy for IP rate limiting if behind reverse proxy
app.set('trust proxy', 1);

// ── SQLite Database Setup ───────────────────────────────────────
const db = new Database(path.join(__dirname, 'inquiries.db'));
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS inquiries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    inquiry_ref TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    company TEXT NOT NULL,
    company_type TEXT,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    services TEXT NOT NULL,
    other_service TEXT,
    project_details TEXT NOT NULL,
    budget_range TEXT,
    timeline TEXT,
    source TEXT,
    ip_address TEXT,
    status TEXT DEFAULT 'new',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS idx_inquiries_email ON inquiries(email);
  CREATE INDEX IF NOT EXISTS idx_inquiries_created ON inquiries(created_at);
`);

// ── Rate Limiter (Spam Protection) ─────────────────────────────
const inquiryLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 8, // Max 8 submissions per 10 min per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many inquiries submitted from this IP. Please try again in a few minutes or message us on WhatsApp.'
  }
});

// ── Input Sanitization Helper ───────────────────────────────────
function sanitizeText(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/<[^>]*>?/gm, '') // Strip HTML tags
    .replace(/[\r\n]{3,}/g, '\n\n') // Normalize excessive newlines
    .trim();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone) {
  // Accepts digits, plus, spaces, dashes; min 7 digits
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15;
}

// ── Email Transporter Setup ─────────────────────────────────────
const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
const smtpPort = parseInt(process.env.SMTP_PORT || '465', 10);
const smtpSecure = process.env.SMTP_SECURE === 'true' || smtpPort === 465;
const smtpUser = process.env.SMTP_USER || 'tectomarksupport@gmail.com';
const smtpPass = process.env.SMTP_PASS || 'pzzcylzqlwtzxtnl';

let transporter = null;
if (smtpHost && smtpUser && smtpPass) {
  transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: {
      user: smtpUser,
      pass: smtpPass
    }
  });
  console.log('✓ SMTP Email Transporter configured for:', smtpUser);
} else {
  console.log('ℹ SMTP credentials not set in .env — inquiries will be safely saved to SQLite and emails logged to console.');
}

// ── Email Dispatch Functions ────────────────────────────────────

/**
 * 1. Internal notification email -> Tecto Mark inbox
 */
async function sendInternalNotification(inquiry) {
  const serviceList = inquiry.services.map(s => `  • ${s}`).join('\n');
  const serviceHtmlList = inquiry.services.map(s => `<li style="margin-bottom:6px;">${s}</li>`).join('');

  const subject = `New Inquiry — ${inquiry.company} (${inquiry.services.slice(0, 2).join(', ')}${inquiry.services.length > 2 ? '...' : ''})`;

  const textBody = `
NEW SERVICE INQUIRY RECEIVED — TECTO MARK
==========================================
Reference:   ${inquiry.inquiryRef}
Submitted:   ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST

CONTACT DETAILS:
Name:        ${inquiry.name}
Company:     ${inquiry.company} (${inquiry.companyType || 'Not specified'})
Email:       ${inquiry.email}
Phone:       ${inquiry.phone}

Quick Actions:
Reply by Email: mailto:${inquiry.email}
Direct Call:    tel:${inquiry.phone}
Chat WhatsApp:  https://wa.me/${inquiry.phone.replace(/\D/g, '')}

SERVICES REQUESTED:
${serviceList}
${inquiry.otherService ? `Custom Need:  ${inquiry.otherService}` : ''}

PROJECT SCOPE:
Budget:      ${inquiry.budgetRange || 'Not specified'}
Timeline:    ${inquiry.timeline || 'Not specified'}
Source:      ${inquiry.source || 'Website Hero/Contact'}

PROJECT DETAILS:
${inquiry.projectDetails}
==========================================
`;

  const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;line-height:1.5;color:#111;background:#f5f5f7;padding:30px 15px;margin:0;">
  <div style="max-width:600px;margin:0 auto;background:#fff;border:1px solid #e1e4e8;border-radius:12px;overflow:hidden;box-shadow:0 4px 14px rgba(0,0,0,0.06);">
    <div style="background:#07080A;padding:24px 30px;border-bottom:2px solid #2D5BFF;">
      <h1 style="color:#fff;font-size:20px;letter-spacing:0.1em;margin:0;font-weight:800;">TECTO MARK</h1>
      <p style="color:#2D5BFF;font-size:12px;margin:4px 0 0 0;font-weight:600;letter-spacing:0.05em;">NEW SERVICE INQUIRY — ${inquiry.inquiryRef}</p>
    </div>
    <div style="padding:28px 30px;">
      <div style="display:flex;gap:12px;margin-bottom:24px;">
        <a href="mailto:${inquiry.email}" style="display:inline-block;padding:10px 18px;background:#2D5BFF;color:#fff;text-decoration:none;border-radius:6px;font-size:13px;font-weight:700;">Reply via Email →</a>
        <a href="tel:${inquiry.phone}" style="display:inline-block;padding:10px 18px;background:#07080A;color:#fff;text-decoration:none;border-radius:6px;font-size:13px;font-weight:700;">Call Client</a>
      </div>

      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;font-size:14px;">
        <tr style="border-bottom:1px solid #eee;"><td style="padding:8px 0;color:#666;width:120px;font-weight:600;">Prospect:</td><td style="padding:8px 0;font-weight:700;color:#111;">${inquiry.name}</td></tr>
        <tr style="border-bottom:1px solid #eee;"><td style="padding:8px 0;color:#666;font-weight:600;">Company:</td><td style="padding:8px 0;font-weight:600;">${inquiry.company} <span style="color:#888;">(${inquiry.companyType})</span></td></tr>
        <tr style="border-bottom:1px solid #eee;"><td style="padding:8px 0;color:#666;font-weight:600;">Email:</td><td style="padding:8px 0;"><a href="mailto:${inquiry.email}" style="color:#2D5BFF;text-decoration:none;">${inquiry.email}</a></td></tr>
        <tr style="border-bottom:1px solid #eee;"><td style="padding:8px 0;color:#666;font-weight:600;">Phone:</td><td style="padding:8px 0;"><a href="tel:${inquiry.phone}" style="color:#111;text-decoration:none;font-weight:600;">${inquiry.phone}</a></td></tr>
        <tr style="border-bottom:1px solid #eee;"><td style="padding:8px 0;color:#666;font-weight:600;">Budget:</td><td style="padding:8px 0;font-weight:600;color:#2D5BFF;">${inquiry.budgetRange || 'Not specified'}</td></tr>
        <tr style="border-bottom:1px solid #eee;"><td style="padding:8px 0;color:#666;font-weight:600;">Timeline:</td><td style="padding:8px 0;">${inquiry.timeline || 'Not specified'}</td></tr>
      </table>

      <h3 style="font-size:13px;letter-spacing:0.08em;color:#444;text-transform:uppercase;margin:20px 0 10px 0;">Requested Services:</h3>
      <ul style="margin:0 0 20px 0;padding-left:20px;color:#222;font-size:14px;">
        ${serviceHtmlList}
      </ul>
      ${inquiry.otherService ? `<p style="font-size:13px;color:#444;"><strong>Custom Requirement:</strong> ${inquiry.otherService}</p>` : ''}

      <h3 style="font-size:13px;letter-spacing:0.08em;color:#444;text-transform:uppercase;margin:24px 0 10px 0;">Project Details:</h3>
      <div style="background:#f9fafb;border-left:3px solid #2D5BFF;padding:14px 18px;border-radius:4px;font-size:14px;color:#222;white-space:pre-wrap;">${inquiry.projectDetails}</div>
    </div>
    <div style="background:#f4f5f7;padding:16px 30px;font-size:12px;color:#888;border-top:1px solid #e1e4e8;">
      Tecto Mark Inquiries Pipeline • Stored in inquiries.db (${inquiry.inquiryRef})
    </div>
  </div>
</body>
</html>
`;

  if (transporter) {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || `"Tecto Mark Alerts" <${ADMIN_EMAIL}>`,
      to: ADMIN_EMAIL,
      subject,
      text: textBody,
      html: htmlBody
    });
    console.log(`✓ Internal notification email sent via SMTP to ${ADMIN_EMAIL} for ${inquiry.inquiryRef}`);
  } else {
    // Attempt webhook dispatch to FormSubmit for instant zero-config email delivery to Gmail
    try {
      const fsRes = await fetch(`https://formsubmit.co/ajax/${ADMIN_EMAIL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Referer': 'https://tectomark.com'
        },
        body: JSON.stringify({
          _subject: `New Inquiry — ${inquiry.company} (${inquiry.services.slice(0, 2).join(', ')})`,
          Reference: inquiry.inquiryRef,
          Name: inquiry.name,
          Company: `${inquiry.company} (${inquiry.companyType || 'Not specified'})`,
          Email: inquiry.email,
          Phone: inquiry.phone,
          Services: inquiry.services.join(', ') + (inquiry.otherService ? ` (Other: ${inquiry.otherService})` : ''),
          Budget: inquiry.budgetRange || 'Not specified',
          Timeline: inquiry.timeline || 'Not specified',
          Project_Details: inquiry.projectDetails,
          Quick_WhatsApp: `https://wa.me/${inquiry.phone.replace(/\D/g, '')}`
        })
      });
      const fsData = await fsRes.json();
      console.log(`✓ Outbound inquiry delivered to ${ADMIN_EMAIL} via FormSubmit webhook:`, fsData.message || fsData.success);
    } catch (fsErr) {
      console.error('Webhook email dispatch error:', fsErr.message);
    }

    console.log(`\n--- [OUTBOUND EMAIL DISPATCH LOGGED: ${ADMIN_EMAIL}] ---`);
    console.log(`To: ${ADMIN_EMAIL}`);
    console.log(`Subject: ${subject}`);
    console.log(textBody);
    console.log(`--------------------------------------------------------\n`);
  }
}

/**
 * 2. Confirmation email -> Prospect
 */
async function sendProspectConfirmation(inquiry) {
  const firstName = inquiry.name.split(' ')[0] || inquiry.name;
  const serviceHtmlList = inquiry.services.map(s => `<li style="margin-bottom:6px;color:#2D5BFF;font-weight:600;"><span style="color:#222;font-weight:500;">${s}</span></li>`).join('');

  const subject = `We've received your inquiry, ${firstName} — Tecto Mark`;

  const textBody = `
Hi ${firstName},

Thanks for reaching out to Tecto Mark.

We've received your inquiry regarding:
${inquiry.services.map(s => `- ${s}`).join('\n')}

Here's what happens next — our team is reviewing your project requirements and will get back to you within 24 hours with strategic next steps.

If your project requires urgent discussion or you prefer chatting in real-time, you can connect directly with us on WhatsApp:
https://wa.me/919555013580?text=Hi%20Tecto%20Mark%2C%20following%20up%20on%20my%20inquiry%20${inquiry.inquiryRef}

In the meantime, feel free to explore some of our recent work:
https://tectomark.com/#work

Talk soon,
The Tecto Mark Team

—
TECTO MARK
Build. Promote. Grow.
support: tectomarksupport@gmail.com
call: +91 95550 13580 / +91 91207 00838
`;

  const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;line-height:1.6;color:#1A1A1E;background:#07080A;padding:40px 15px;margin:0;">
  <div style="max-width:580px;margin:0 auto;background:#0E1017;border:1px solid rgba(255,255,255,0.1);border-radius:14px;overflow:hidden;box-shadow:0 12px 36px rgba(0,0,0,0.5);">
    <div style="padding:36px 36px 20px 36px;">
      <span style="display:inline-block;font-size:18px;font-weight:900;letter-spacing:0.18em;color:#FFFFFF;margin-bottom:28px;">TECTO MARK<span style="color:#2D5BFF;">.</span></span>

      <h2 style="font-size:24px;font-weight:800;letter-spacing:-0.03em;color:#FFFFFF;margin:0 0 16px 0;line-height:1.2;">
        Thanks, ${firstName}.<br>We'll be in touch.
      </h2>

      <p style="font-size:15px;color:rgba(255,255,255,0.7);margin:0 0 24px 0;">
        We have received your project inquiry for <strong style="color:#FFFFFF;">${inquiry.company}</strong>. Someone from our core strategy team will review your objectives and reply within <strong style="color:#FFFFFF;">24 hours</strong> at <span style="color:#2D5BFF;">${inquiry.email}</span>.
      </p>

      <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:20px 24px;margin-bottom:28px;">
        <span style="font-size:11px;font-family:monospace;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.45);display:block;margin-bottom:10px;">Selected Services</span>
        <ul style="margin:0;padding-left:18px;font-size:14px;">
          ${serviceHtmlList}
        </ul>
      </div>

      <p style="font-size:14px;color:rgba(255,255,255,0.65);margin:0 0 28px 0;">
        Need immediate answers or have quick details to share? Feel free to connect directly on WhatsApp:
      </p>

      <a href="https://wa.me/919555013580?text=Hi%20Tecto%20Mark%2C%20following%20up%20on%20my%20inquiry%20${inquiry.inquiryRef}" style="display:inline-block;padding:12px 24px;background:#2D5BFF;color:#FFFFFF;text-decoration:none;border-radius:9999px;font-size:14px;font-weight:700;letter-spacing:0.04em;">
        Chat with Team on WhatsApp →
      </a>
    </div>

    <div style="background:rgba(0,0,0,0.3);padding:24px 36px;border-top:1px solid rgba(255,255,255,0.06);font-size:12px;color:rgba(255,255,255,0.4);">
      <p style="margin:0 0 6px 0;color:rgba(255,255,255,0.6);font-weight:600;">TECTO MARK — Build. Promote. Grow.</p>
      <p style="margin:0;">Reference: ${inquiry.inquiryRef} • Email: tectomarksupport@gmail.com • Phone: +91 95550 13580</p>
    </div>
  </div>
</body>
</html>
`;

  if (transporter) {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || `"Tecto Mark" <${ADMIN_EMAIL}>`,
      to: inquiry.email,
      subject,
      text: textBody,
      html: htmlBody
    });
    console.log(`✓ Confirmation email sent to prospect (${inquiry.email}) for ${inquiry.inquiryRef}`);
  } else {
    console.log(`\n--- [SIMULATED OUTBOUND EMAIL 2: PROSPECT CONFIRMATION] ---`);
    console.log(`To: ${inquiry.email}`);
    console.log(`Subject: ${subject}`);
    console.log(textBody);
    console.log(`------------------------------------------------------------\n`);
  }
}

// ── API Routes ──────────────────────────────────────────────────

/**
 * POST /api/inquiries
 * Submits a qualified service inquiry
 */
app.post('/api/inquiries', inquiryLimiter, async (req, res) => {
  try {
    const {
      name,
      company,
      companyType,
      email,
      phone,
      services,
      otherService,
      projectDetails,
      budgetRange,
      timeline,
      source,
      honeypot
    } = req.body;

    // 1. Honeypot check (bot trap)
    // If the hidden bot field is filled, silently return fake success to fool bots
    if (honeypot && String(honeypot).trim() !== '') {
      console.warn(`[SPAM BLOCKED] Honeypot triggered by IP ${req.ip} with value "${honeypot}"`);
      return res.status(200).json({
        success: true,
        inquiryId: 'TM-' + Math.random().toString(36).substring(2, 9).toUpperCase()
      });
    }

    // 2. Server-side validation
    const cleanName = sanitizeText(name);
    const cleanCompany = sanitizeText(company);
    const cleanEmail = sanitizeText(email).toLowerCase();
    const cleanPhone = sanitizeText(phone);
    const cleanDetails = sanitizeText(projectDetails);
    const cleanCompanyType = sanitizeText(companyType);
    const cleanOther = sanitizeText(otherService);
    const cleanBudget = sanitizeText(budgetRange);
    const cleanTimeline = sanitizeText(timeline);
    const cleanSource = sanitizeText(source) || 'Website';

    if (!cleanName || cleanName.length < 2) {
      return res.status(400).json({ success: false, error: 'Please provide your full name.' });
    }
    if (!cleanCompany || cleanCompany.length < 2) {
      return res.status(400).json({ success: false, error: 'Please provide your company or brand name.' });
    }
    if (!cleanEmail || !isValidEmail(cleanEmail)) {
      return res.status(400).json({ success: false, error: 'Please enter a valid email address.' });
    }
    if (!cleanPhone || !isValidPhone(cleanPhone)) {
      return res.status(400).json({ success: false, error: 'Please enter a valid phone number.' });
    }
    if (!Array.isArray(services) || services.length === 0) {
      return res.status(400).json({ success: false, error: 'Please select at least one service you need.' });
    }
    if (!cleanDetails || cleanDetails.length < 5) {
      return res.status(400).json({ success: false, error: 'Please describe your project or challenge.' });
    }

    // Sanitize services array
    const cleanServices = services.map(s => sanitizeText(s)).filter(Boolean);

    // 3. Generate unique reference ID (e.g. TM-2026-X8F2)
    const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
    const inquiryRef = `TM-${new Date().getFullYear()}-${randomHex}`;

    // 4. Persist to SQLite Database
    const insertStmt = db.prepare(`
      INSERT INTO inquiries (
        inquiry_ref, name, company, company_type, email, phone,
        services, other_service, project_details, budget_range,
        timeline, source, ip_address
      ) VALUES (
        @inquiryRef, @name, @company, @companyType, @email, @phone,
        @services, @otherService, @projectDetails, @budgetRange,
        @timeline, @source, @ipAddress
      )
    `);

    insertStmt.run({
      inquiryRef,
      name: cleanName,
      company: cleanCompany,
      companyType: cleanCompanyType,
      email: cleanEmail,
      phone: cleanPhone,
      services: JSON.stringify(cleanServices),
      otherService: cleanOther || null,
      projectDetails: cleanDetails,
      budgetRange: cleanBudget || null,
      timeline: cleanTimeline || null,
      source: cleanSource,
      ipAddress: req.ip || 'unknown'
    });

    const inquiryPayload = {
      inquiryRef,
      name: cleanName,
      company: cleanCompany,
      companyType: cleanCompanyType,
      email: cleanEmail,
      phone: cleanPhone,
      services: cleanServices,
      otherService: cleanOther,
      projectDetails: cleanDetails,
      budgetRange: cleanBudget,
      timeline: cleanTimeline,
      source: cleanSource
    };

    // 5. Fire outbound emails asynchronously
    Promise.all([
      sendInternalNotification(inquiryPayload),
      sendProspectConfirmation(inquiryPayload)
    ]).catch(err => {
      console.error('Email dispatch error (inquiry saved in DB):', err);
    });

    return res.status(200).json({
      success: true,
      inquiryId: inquiryRef,
      name: cleanName,
      email: cleanEmail
    });

  } catch (err) {
    console.error('Inquiry processing error:', err);
    return res.status(500).json({
      success: false,
      error: 'An unexpected error occurred while processing your inquiry. Please try again or connect via WhatsApp.'
    });
  }
});

/**
 * GET /api/inquiries
 * List inquiries (secured by ADMIN_KEY header or query param)
 */
app.get('/api/inquiries', (req, res) => {
  const providedKey = req.query.key || req.headers['x-admin-key'];
  if (providedKey !== ADMIN_KEY) {
    return res.status(401).json({ error: 'Unauthorized. Provide valid ?key= parameter.' });
  }

  try {
    const rows = db.prepare(`SELECT * FROM inquiries ORDER BY created_at DESC LIMIT 100`).all();
    const formatted = rows.map(r => ({
      ...r,
      services: JSON.parse(r.services || '[]')
    }));
    return res.json({ total: formatted.length, inquiries: formatted });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ── Team Photo Upload (TEMP — remove after uploading photos) ────
app.post('/api/upload-team-photo', teamUpload.single('photo'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file received' });
  res.json({ success: true, saved: req.file.filename, path: `assets/team/${req.file.filename}` });
});

// ── Static Files & Fallback ────────────────────────────────────
app.use(express.static(__dirname));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ── Start Server ────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n======================================================`);
  console.log(`🚀 TECTO MARK Server running on port ${PORT}`);
  console.log(`📁 Static files served from: ${__dirname}`);
  console.log(`💾 SQLite Database connected: ${path.join(__dirname, 'inquiries.db')}`);
  console.log(`======================================================\n`);
});
