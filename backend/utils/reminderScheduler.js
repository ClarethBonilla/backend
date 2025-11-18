import cron from 'node-cron';
import nodemailer from 'nodemailer';
import Cita from '../models/Cita.js';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

// Helper: sends email, with fallback to Ethereal test account when no SMTP configured
async function sendEmailReminder(cita) {
  if (!cita.email) return;
  const mailOptions = {
    from: process.env.SMTP_FROM || 'no-reply@misonrisa.local',
    to: cita.email,
    subject: `Recordatorio: cita con MiSonrisa ${new Date(cita.fecha).toLocaleString()}`,
    text: `Hola ${cita.paciente},\n\nTe recordamos tu cita para ${cita.tratamiento} el ${new Date(cita.fecha).toLocaleString()}.\n\nNotas: ${cita.notas || '-'}\n\nSaludos,\nMiSonrisa`
  };

  // If SMTP configured, use it. Otherwise create a test account (Ethereal) for local testing.
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : undefined,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    await transporter.sendMail(mailOptions);
  } else {
    // Create test account and send via Ethereal
    const testAccount = await nodemailer.createTestAccount();
    const testTransporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
    const info = await testTransporter.sendMail(mailOptions);
    const preview = nodemailer.getTestMessageUrl(info);
    console.log('Ethereal preview URL:', preview);
  }
}

// Placeholder WhatsApp sender via Twilio (if configured)
async function sendWhatsAppReminder(cita) {
  if (!process.env.TWILIO_SID || !process.env.TWILIO_TOKEN || !process.env.TWILIO_WHATSAPP_FROM || !cita.telefono) return;
  const accountSid = process.env.TWILIO_SID;
  const authToken = process.env.TWILIO_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM;
  const to = `whatsapp:${cita.telefono}`;
  const body = `Recordatorio: tienes una cita para ${cita.tratamiento} el ${new Date(cita.fecha).toLocaleString()}`;
  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const params = new URLSearchParams();
  params.append('From', from);
  params.append('To', to);
  params.append('Body', body);

  await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64')
    },
    body: params
  });
}

// Function that checks upcoming reminders and sends them
async function checkAndSendReminders() {
  try {
    const now = new Date();
    // Find citas with reminderScheduledAt <= now, not yet sent, and estado not cancelada
    const pendientes = await Cita.find({ reminderScheduledAt: { $lte: now }, reminderSent: false, estado: { $ne: 'cancelada' } }).exec();
    for (const cita of pendientes) {
      try {
        if (cita.reminderMethod === 'email' || cita.reminderMethod === 'both') {
          await sendEmailReminder(cita);
        }
        if (cita.reminderMethod === 'whatsapp' || cita.reminderMethod === 'both') {
          await sendWhatsAppReminder(cita);
        }
        cita.reminderSent = true;
        await cita.save();
      } catch (err) {
        console.error('Error sending reminder for cita', cita._id, err.message);
      }
    }
  } catch (err) {
    console.error('Error checking reminders', err.message);
  }
}

let started = false;
export function startReminderScheduler() {
  if (started) return;
  // Run every minute
  cron.schedule('* * * * *', () => {
    checkAndSendReminders();
  });
  started = true;
  console.log('Reminder scheduler started (checks every minute)');
}

// Export the check function so it can be invoked manually for tests
export { checkAndSendReminders };

export default { startReminderScheduler, checkAndSendReminders };
