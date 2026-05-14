import nodemailer from 'nodemailer';

let _transporter = null;

function getTransporter() {
  if (_transporter) return _transporter;
  _transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  return _transporter;
}

function isConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

export async function sendAdvisorNewClientEmail({ advisorEmail, advisorName, clientName, clientEmail, clientNit }) {
  if (!isConfigured()) {
    console.warn('[mailer] SMTP no configurado (SMTP_HOST/SMTP_USER/SMTP_PASS faltantes) — omitiendo notificación');
    return;
  }

  const from = process.env.SMTP_FROM ?? process.env.SMTP_USER;
  await getTransporter().sendMail({
    from,
    to: advisorEmail,
    subject: `Nuevo cliente asignado: ${clientName}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:540px;margin:0 auto;color:#1f2937">
        <h2 style="color:#1d4ed8;margin-bottom:8px">Nuevo cliente registrado</h2>
        <p>Hola <strong>${advisorName}</strong>,</p>
        <p>Se ha registrado un nuevo cliente en tu cartera en la plataforma DAVAL:</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <tr><td style="padding:8px;background:#f3f4f6;font-weight:bold;width:140px">Nombre</td><td style="padding:8px;border-bottom:1px solid #e5e7eb">${clientName}</td></tr>
          <tr><td style="padding:8px;background:#f3f4f6;font-weight:bold">Email</td><td style="padding:8px;border-bottom:1px solid #e5e7eb">${clientEmail}</td></tr>
          <tr><td style="padding:8px;background:#f3f4f6;font-weight:bold">NIT</td><td style="padding:8px">${clientNit}</td></tr>
        </table>
        <p style="color:#6b7280;font-size:13px">Este es un mensaje automático generado por DAVAL App.</p>
      </div>
    `,
  });

  console.log(`[mailer] advisor-new-client email enviado a ${advisorEmail} (cliente: ${clientName})`);
}
