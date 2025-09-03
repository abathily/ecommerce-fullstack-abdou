// routes/contactRoutes.js
import express from "express";
import nodemailer from "nodemailer";

const router = express.Router();

// Petite validation d'email
function isValidEmail(email = "") {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

// Crée un transporter nodemailer depuis les variables d'environnement
function createTransporter() {
  const {
    MAIL_SERVICE,
    MAIL_PORT,
    MAIL_USER,
    MAIL_PASS
  } = process.env;

  // Si un service est fourni (ex: gmail), on l'utilise
  if (MAIL_SERVICE) {
    return nodemailer.createTransport({
      service: MAIL_SERVICE,
      auth: { user: MAIL_USER, pass: MAIL_PASS }
    });
  }

  // Sinon, configuration par host/port (adapter si besoin via .env : MAIL_HOST)
  const port = Number(MAIL_PORT) || 587;
  const secure = port === 465;
  return nodemailer.createTransport({
    host: process.env.MAIL_HOST || "smtp.gmail.com",
    port,
    secure,
    auth: { user: MAIL_USER, pass: MAIL_PASS }
  });
}

router.post("/", async (req, res) => {
  const { name = "", email = "", subject = "", message = "" } = req.body || {};

  // Validations simples
  if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
    return res.status(400).json({ success: false, error: "Tous les champs sont requis." });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ success: false, error: "Email invalide." });
  }

  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.MAIL_USER,          // expéditeur authentifié (évite les rejets SPF/DKIM)
      to: process.env.MAIL_RECEIVER,        // destinataire (toi)
      replyTo: email,                       // permet de répondre au contact
      subject: `${subject} - de ${name}`,
      html: `
        <p><strong>Nom:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong><br/>${message.replace(/\n/g, "<br/>")}</p>
      `
    };

    await transporter.sendMail(mailOptions);
    return res.status(200).json({ success: true, message: "Message envoyé avec succès." });
  } catch (err) {
    console.error("Erreur d’envoi de mail:", err.message);
    return res.status(500).json({ success: false, error: "Erreur lors de l’envoi du message." });
  }
});

export default router;
