const { app } = require('@azure/functions');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const NotificationLog = require('../models/notification.model');

let connectionPromise;
let transporter;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) return;
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is required');
  }
  if (!connectionPromise) {
    connectionPromise = mongoose.connect(process.env.MONGO_URI).catch((error) => {
      connectionPromise = undefined;
      throw error;
    });
  }
  await connectionPromise;
};

const getTransporter = () => {
  if (transporter) return transporter;
  if (!process.env.SMTP_HOST) {
    throw new Error('SMTP_HOST is required');
  }

  const options = {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
  };
  if (process.env.SMTP_USER) {
    options.auth = {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    };
  }
  transporter = nodemailer.createTransport(options);
  return transporter;
};

const escapeHtml = (value) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const money = (value) => Number(value || 0).toFixed(2);

const buildOrderRows = (items = []) => items.map((item) => `
  <tr style="border-bottom:1px solid #eee">
    <td style="padding:8px">${escapeHtml(item.name)}</td>
    <td style="padding:8px">x${escapeHtml(item.quantity)}</td>
    <td style="padding:8px">INR ${money(Number(item.price) * Number(item.quantity))}</td>
  </tr>
`).join('');

const buildEmailHtml = (type, payload = {}) => {
  if (type === 'order_confirmation') {
    return `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px">
        <h2 style="color:#1d4ed8">Order confirmed</h2>
        <p>Your order <strong>#${escapeHtml(payload.orderId)}</strong> was placed successfully.</p>
        <table style="width:100%;border-collapse:collapse">${buildOrderRows(payload.items)}</table>
        <p><strong>Total: INR ${money(payload.totalAmount)}</strong></p>
        <p style="color:#666;font-size:12px">KubeCart</p>
      </div>`;
  }

  if (type === 'order_cancelled') {
    return `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px">
        <h2 style="color:#b91c1c">Order cancelled</h2>
        <p>Your order <strong>#${escapeHtml(payload.orderId)}</strong> has been cancelled.</p>
        <p style="color:#666;font-size:12px">KubeCart</p>
      </div>`;
  }

  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px">
      <p>${escapeHtml(payload.message || 'Notification from KubeCart.')}</p>
    </div>`;
};

const normalizeMessage = (message) => {
  if (typeof message === 'string') return JSON.parse(message);
  if (Buffer.isBuffer(message)) return JSON.parse(message.toString('utf8'));
  return message;
};

const notificationProcessor = async (message, context) => {
  const notification = normalizeMessage(message);
  const messageId = String(
    notification?.messageId || context.triggerMetadata.messageId || ''
  );
  const { to, type, subject, payload = {} } = notification || {};

  if (!messageId || !to || !type || !subject) {
    throw new Error('Invalid notification message');
  }

  await connectDB();
  let log = await NotificationLog.findOne({ messageId });
  if (log?.status === 'sent') {
    context.log(`Skipping already-sent notification ${messageId}`);
    return;
  }

  if (!log) {
    log = await NotificationLog.create({
      messageId,
      to,
      type,
      subject,
      payload,
      status: 'pending',
    });
  }

  try {
    await getTransporter().sendMail({
      from: `"KubeCart" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to,
      subject,
      html: buildEmailHtml(type, payload),
    });
    log.status = 'sent';
    log.errorMessage = '';
    log.sentAt = new Date();
    await log.save();
    context.log(`Notification ${messageId} sent to ${to}`);
  } catch (error) {
    log.status = 'failed';
    log.errorMessage = error.message;
    log.retries += 1;
    await log.save();
    context.error(`Notification ${messageId} failed: ${error.message}`);
    throw error;
  }
};

app.serviceBusQueue('notificationProcessor', {
  connection: 'ServiceBusConnection',
  queueName: process.env.SERVICE_BUS_NOTIFICATION_QUEUE || 'notifications',
  handler: notificationProcessor,
});

module.exports = { notificationProcessor };
