import { createTransport } from "nodemailer";

const esc = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );

export function buildMagicLinkMessage(url: string, host: string) {
  return {
    subject: `Sign in to ${host}`,
    text: `Sign in to ${host}:\n${url}\n\nIf you didn't request this, you can ignore this email.`,
    html: `<p>Sign in to <strong>${esc(host)}</strong>:</p><p><a href="${esc(url)}">Sign in</a></p><p>If you didn't request this, you can ignore this email.</p>`,
  };
}

export async function sendMagicLink({ identifier, url }: { identifier: string; url: string }) {
  const server = process.env.EMAIL_SERVER;
  if (!server) {
    if (process.env.NODE_ENV === "production") throw new Error("Email sign-in is not configured");
    console.warn(`[auth] Magic link for ${identifier}: ${url}`);
    return;
  }
  const host = new URL(url).host;
  await createTransport(server).sendMail({
    to: identifier,
    from: process.env.EMAIL_FROM ?? `no-reply@${host}`,
    ...buildMagicLinkMessage(url, host),
  });
}
