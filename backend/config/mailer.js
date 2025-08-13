const nodemailer = require('nodemailer');
const path = require('path');
const dotenv = require('dotenv');

// Load root .env (one directory up from config)
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const user = (process.env.EMAIL_USER || '').trim();
const pass = (process.env.EMAIL_PASS || '').trim();

// Basic guard so app doesn't crash if env missing
if (!user || !pass) {
    console.warn('[mailer] EMAIL_USER or EMAIL_PASS not set. Emails will fail until configured.');
}

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass }
});

// Lightweight verify (async) – won't block startup
transporter.verify().then(() => {
    console.log('[mailer] Transporter ready for user', user);
}).catch(err => {
    console.warn('[mailer] Transport verify failed:', err.message);
});

module.exports = transporter;
