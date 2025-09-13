// lib/mail.ts
import { Resend } from "resend";
import nodemailer from "nodemailer";

const resendKey = process.env.RESEND_API_KEY;

export async function sendResetEmail(to: string, url: string) {
  const subject = "Recupera tu contraseña — CodeFlow";
  const html = `
    <div style="font-family:system-ui,Segoe UI,Roboto,Arial">
      <h2>Recupera tu contraseña</h2>
      <p>Has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace:</p>
      <p><a href="${url}" style="display:inline-block;background:#1ea1ff;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none">Cambiar contraseña</a></p>
      <p>Si no solicitaste este cambio, puedes ignorar este correo.</p>
      <p>Enlace válido por 30 minutos.</p>
    </div>
  `;

  if (resendKey) {
    const resend = new Resend(resendKey);
    await resend.emails.send({
      from: process.env.SMTP_FROM || "CodeFlow <no-reply@codeflow.app>",
      to,
      subject,
      html,
    });
    return;
  }

  // Fallback SMTP
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM || "CodeFlow <no-reply@example.com>",
    to,
    subject,
    html,
  });
}
