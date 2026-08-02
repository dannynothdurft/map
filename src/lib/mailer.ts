import "server-only";
import nodemailer from "nodemailer";

interface SendInviteEmailParams {
  to: string;
  name?: string;
  inviteUrl: string;
  invitedByName: string;
}

function getTransport() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD } = process.env;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASSWORD) {
    throw new Error(
      "SMTP ist nicht konfiguriert. Bitte SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD und SMTP_FROM in .env.local setzen.",
    );
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
  });
}

export async function sendInviteEmail({ to, name, inviteUrl, invitedByName }: SendInviteEmailParams) {
  const transport = getTransport();
  // SMTP_FROM is a display name (e.g. "APO MAP"), not an address - nodemailer
  // needs the actual mailbox from SMTP_USER to build a valid From header.
  const displayName = process.env.SMTP_FROM;
  const from = displayName ? `"${displayName}" <${process.env.SMTP_USER}>` : process.env.SMTP_USER;
  const greeting = name ? `Hallo ${name},` : "Hallo,";

  await transport.sendMail({
    from,
    to,
    subject: "Einladung zu APO MAP",
    text: `${greeting}\n\n${invitedByName} hat dich zu APO MAP eingeladen. Öffne diesen Link, um dein Konto einzurichten:\n\n${inviteUrl}\n\nDer Link ist 7 Tage gültig.`,
    html: `<p>${greeting}</p><p>${invitedByName} hat dich zu <strong>APO MAP</strong> eingeladen.</p><p><a href="${inviteUrl}">${inviteUrl}</a></p><p>Der Link ist 7 Tage gültig.</p>`,
  });
}
