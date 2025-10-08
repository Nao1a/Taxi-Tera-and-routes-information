const path = require('path');
const dotenv = require('dotenv');
const { Resend } = require('resend');

// Load backend .env (one directory up from config)
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const RESEND_API_KEY = (process.env.RESEND_API_KEY || '').trim();
const DEFAULT_FROM = (process.env.EMAIL_FROM || '').trim();

if (!RESEND_API_KEY) {
    console.warn('[mailer] RESEND_API_KEY not set. Emails will fail until configured.');
}

// Initialize Resend client if key is present
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

// Create a Nodemailer-compatible shape with sendMail(opts)
const transporter = {
    async sendMail({ from, to, subject, html, text }) {
        if (!resend) {
            const err = new Error('Email service not configured (missing RESEND_API_KEY).');
            err.code = 'EMAIL_NOT_CONFIGURED';
            throw err;
        }

        // Ensure from is set to a verified sender/domain in your Resend account
        const mailFrom = (from && from.trim()) || DEFAULT_FROM || 'no-reply@example.com';

        // Resend accepts string or string[] for `to`
        const payload = { from: mailFrom, to, subject, html, text };

        const { data, error } = await resend.emails.send(payload);
        if (error) {
            const e = new Error(error.message || 'Failed to send email via Resend');
            e.cause = error;
            throw e;
        }
        // Return data for compatibility; callers in this codebase don't inspect it
        return data;
    },
    async verify() {
        if (!resend) {
            throw new Error('RESEND_API_KEY not set');
        }
        // No explicit verify endpoint; perform a cheap no-op check
        return true;
    }
};

// Lightweight verify (async) – won't block startup
transporter.verify().then(() => {
    console.log('[mailer] Resend mailer ready');
}).catch(err => {
    console.warn('[mailer] Mailer verify failed:', err.message);
});

module.exports = transporter;
