const nodemailer = require('nodemailer');

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

if (!EMAIL_USER || !EMAIL_PASS) {
  console.warn('⚠️ EMAIL_USER or EMAIL_PASS not set. Forgot-password emails will fail until configured.');
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

async function sendMail({ to, subject, text, html }) {
  const from = process.env.EMAIL_FROM || EMAIL_USER;
  return transporter.sendMail({ from, to, subject, text, html });
}

module.exports = { sendMail };
