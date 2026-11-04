const nodemailer = require('nodemailer');
const Newsletter = require("../models/newsletterSchema");

const normalizeSmtpConfig = (config = {}) => {
  const host = String(config.SMTP_HOST || config.host || '').trim();
  const portValue = String(config.SMTP_PORT || config.port || '').trim();
  const user = String(config.SMTP_USER || config.user || '').trim();
  const pass = String(config.SMTP_PASS || config.pass || '').replace(/\s+/g, '');

  return {
    host,
    port: Number(portValue) || 0,
    user,
    pass,
  };
};

exports.normalizeSmtpConfig = normalizeSmtpConfig;

const buildWelcomeMessage = (email) => ({
  text: `Hello!\n\nWelcome to our newsletter, ${email}. We are excited to keep you updated with the latest stories and insights.`,
  html: `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">
      <h2 style="color: #4338ca; margin-bottom: 12px;">Welcome to our newsletter!</h2>
      <p>Hello, <strong>${email}</strong></p>
      <p>We’re excited to keep you updated with the latest stories, news, and ideas from our blog.</p>
      <p>Thanks for joining us.</p>
    </div>
  `,
});

exports.subscribeToNewsletter = async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address.',
      });
    }

    const { host, port, user, pass } = normalizeSmtpConfig(process.env);
    const hasSmtpConfig = Boolean(host && port && user && pass);

    if (!hasSmtpConfig) {
      console.log(`[Newsletter] SMTP is not configured. Email would be sent to ${email}`);
      return res.status(200).json({
        success: true,
        message: 'Welcome to our newsletter! Your email has been added.',
      });
    }

    const existingSubscription = await Newsletter.findOne({ email });
    if (existingSubscription) {
      return res.status(200).json({
        success: true,
        message: 'You are already subscribed to our newsletter.',
      });
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
      logger: true,
      debug: true,
    });

    const { text, html } = buildWelcomeMessage(email);
    const senderEmail = String(process.env.EMAIL_FROM || user).trim();

    console.log(`[Newsletter] Sending welcome email to ${email}`);

    await transporter.sendMail({
      from: senderEmail,
      to: email,
      replyTo: senderEmail,
      subject: 'Welcome to our newsletter',
      text,
      html,
    });

    await Newsletter.create({ email });

    return res.status(200).json({
      success: true,
      message: 'Welcome to our newsletter! A welcome email has been sent.',
    });
  } catch (error) {
    console.error('[Newsletter] Email send failed:', error);

    const smtpMessage =
      error?.code === 'EAUTH' || error?.responseCode === 535
        ? 'SMTP authentication failed. Check your Gmail app password / SMTP credentials and ensure the sender account is allowed to send mail.'
        : error?.message || 'Newsletter signup failed. Please try again later.';

    return res.status(500).json({
      success: false,
      message: smtpMessage,
    });
  }
};
