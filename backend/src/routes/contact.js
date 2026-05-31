const express    = require('express');
const nodemailer = require('nodemailer');
const router     = express.Router();

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.CONTACT_EMAIL,
    pass: process.env.CONTACT_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

router.post('/', async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Faltan campos obligatorios.' });
  }

  const subjectMap = {
    sugerencia:   'Sugerencia de juego',
    colaboracion: 'Quiero colaborar',
    error:        'Reportar un error',
    otro:         'Otro',
  };
  const subjectLabel = subjectMap[subject] || 'Sin asunto';

  try {
    await transporter.sendMail({
      from:    `"GameVault Contacto" <${process.env.CONTACT_EMAIL}>`,
      to:      process.env.CONTACT_EMAIL,
      replyTo: email,
      subject: `[GameVault] ${subjectLabel} — ${name}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#09090b;color:#f4f4f5;padding:32px;border-radius:12px">
          <h2 style="color:#7c3aed;margin-top:0">Nuevo mensaje de contacto</h2>
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="padding:8px 0;color:#a1a1aa;width:120px">Nombre</td><td style="padding:8px 0;font-weight:bold">${name}</td></tr>
            <tr><td style="padding:8px 0;color:#a1a1aa">Email</td><td style="padding:8px 0"><a href="mailto:${email}" style="color:#7c3aed">${email}</a></td></tr>
            <tr><td style="padding:8px 0;color:#a1a1aa">Asunto</td><td style="padding:8px 0">${subjectLabel}</td></tr>
          </table>
          <hr style="border-color:#27272a;margin:20px 0"/>
          <p style="color:#a1a1aa;margin-bottom:8px">Mensaje:</p>
          <p style="background:#18181b;padding:16px;border-radius:8px;border-left:3px solid #7c3aed;white-space:pre-wrap">${message}</p>
          <p style="color:#52525b;font-size:12px;margin-top:24px">Enviado desde gamevault.es</p>
        </div>
      `,
    });
    res.json({ message: 'Mensaje enviado correctamente.' });
  } catch (err) {
    console.error('Error enviando email:', err);
    res.status(500).json({ error: 'Error al enviar el mensaje.' });
  }
});

module.exports = router;
