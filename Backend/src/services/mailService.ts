import nodemailer from "nodemailer";
import { env } from "../config/env.js";

let cachedTransporter: nodemailer.Transporter | null = null;

function assertMailConfig() {
  if (!env.smtpHost || !env.smtpPort || !env.smtpFromEmail) {
    throw new Error("Mail service is not configured. Set SMTP_HOST, SMTP_PORT, and SMTP_FROM_EMAIL.");
  }
}

function getTransporter() {
  if (cachedTransporter) return cachedTransporter;
  assertMailConfig();

  const auth =
    env.smtpUser && env.smtpPass
      ? {
          user: env.smtpUser,
          pass: env.smtpPass
        }
      : undefined;

  cachedTransporter = nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpSecure,
    auth
  });

  return cachedTransporter;
}

export async function sendPasswordResetEmail({
  toEmail,
  fullName,
  resetUrl,
  expiresMinutes
}: {
  toEmail: string;
  fullName: string;
  resetUrl: string;
  expiresMinutes: number;
}) {
  const transporter = getTransporter();
  const recipientName = String(fullName || "Mtumiaji").trim();
  const textBody = [
    `Habari ${recipientName},`,
    "",
    "Tumepokea ombi la kubadili password ya akaunti yako.",
    `Bofya link hii kuweka password mpya: ${resetUrl}`,
    "",
    `Link hii ita-expire ndani ya dakika ${expiresMinutes}.`,
    "Kama hukutuma ombi hili, puuza email hii."
  ].join("\n");

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #0f172a;">
      <p>Habari ${recipientName},</p>
      <p>Tumepokea ombi la kubadili password ya akaunti yako.</p>
      <p>
        <a href="${resetUrl}" style="display:inline-block;padding:10px 14px;background:#1d4ed8;color:#fff;text-decoration:none;border-radius:8px;">
          Weka Password Mpya
        </a>
      </p>
      <p>Au tumia link hii moja kwa moja:</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>Link hii ita-expire ndani ya dakika ${expiresMinutes}.</p>
      <p>Kama hukutuma ombi hili, puuza email hii.</p>
    </div>
  `;

  await transporter.sendMail({
    from: `"${env.smtpFromName}" <${env.smtpFromEmail}>`,
    to: toEmail,
    subject: "Password Reset - DODOMA MAKULU SDA CHURCH",
    text: textBody,
    html: htmlBody
  });
}
