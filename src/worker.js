// Renwick Systems - the Worker in front of the static site (2026-11-19).
// One job: POST /api/start takes the "Start with a Discovery week" form and emails it to the owner through Cloudflare
// Email Routing (the send_email binding START_MAIL in wrangler.jsonc, locked to the routing's verified destination).
// Every other request is the static site in public/, served by the ASSETS binding.
import { EmailMessage } from "cloudflare:email";

const FROM = "form@renwicksystems.com";
const OFFERS = {
  discovery_week: "Discovery week",
  prototype: "Prototype",
  pilot_60_days: "Pilot, 60 days",
  operate: "Operate",
};
const LIMITS = { firstname: 120, company: 160, email: 254, message: 5000 };
const EMAIL_RE = /^[^\s@<>"',;:]+@[^\s@<>"',;:]+\.[^\s@<>"',;:]+$/;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/start") {
      if (request.method !== "POST") return json({ ok: false, error: "Use POST." }, 405);
      return handleStart(request, env);
    }
    return env.ASSETS.fetch(request);
  },
};

async function handleStart(request, env) {
  let form;
  try {
    form = await request.formData();
  } catch {
    return json({ ok: false, error: "The form could not be read." }, 400);
  }

  // Spam trap: a hidden field people never see. A bot that fills it gets a quiet success and nothing is sent.
  if (String(form.get("website") || "").trim() !== "") return json({ ok: true });

  const field = (name) => String(form.get(name) || "").trim();
  const data = {
    firstname: field("firstname"),
    company: field("company"),
    email: field("email"),
    message: field("message"),
    offer: field("offer"),
  };

  for (const name of ["firstname", "company", "email", "message"]) {
    if (!data[name]) return json({ ok: false, error: "Please fill in every field." }, 400);
    if (data[name].length > LIMITS[name]) return json({ ok: false, error: "One of the fields is too long." }, 400);
  }
  if (!EMAIL_RE.test(data.email)) return json({ ok: false, error: "Please check your email address." }, 400);
  if (!(data.offer in OFFERS)) return json({ ok: false, error: "Please choose a package." }, 400);

  const to = env.START_TO;
  if (!to) {
    console.error("START_TO is not set; the form cannot be delivered.");
    return json({ ok: false, error: "The form is not available right now. Please email hello@renwicksystems.com." }, 503);
  }

  const raw = buildMessage({ to, data, ip: request.headers.get("CF-Connecting-IP") || "unknown" });
  try {
    await env.START_MAIL.send(new EmailMessage(FROM, to, raw));
  } catch (err) {
    console.error("send_email failed:", err && err.message ? err.message : err);
    return json({ ok: false, error: "Your message could not be sent. Please email hello@renwicksystems.com." }, 502);
  }
  return json({ ok: true });
}

function buildMessage({ to, data, ip }) {
  const oneLine = (s) => s.replace(/[\r\n]+/g, " ");
  const offer = OFFERS[data.offer];
  const subject = `Discovery request: ${oneLine(data.company)} (${offer})`;
  const body = [
    "A new request came in through the form on renwicksystems.com.",
    "",
    `Name:         ${oneLine(data.firstname)}`,
    `Business:     ${oneLine(data.company)}`,
    `Email:        ${oneLine(data.email)}`,
    `Interested in: ${offer}`,
    "",
    "What they need to be right:",
    data.message,
    "",
    `Received ${new Date().toUTCString()} from ${ip}.`,
    "Reply to this email to answer them directly.",
  ].join("\r\n");

  const headers = [
    `From: Renwick Systems website <${FROM}>`,
    `To: <${to}>`,
    `Reply-To: <${oneLine(data.email)}>`,
    `Subject: ${encodeHeader(subject)}`,
    `Date: ${new Date().toUTCString()}`,
    `Message-ID: <${crypto.randomUUID()}@renwicksystems.com>`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=utf-8",
    "Content-Transfer-Encoding: base64",
  ];
  return headers.join("\r\n") + "\r\n\r\n" + base64Lines(body);
}

function encodeHeader(text) {
  return /^[\x20-\x7e]*$/.test(text) ? text : `=?UTF-8?B?${base64(text)}?=`;
}

function base64(text) {
  const bytes = new TextEncoder().encode(text);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

function base64Lines(text) {
  return base64(text).replace(/.{1,76}/g, "$&\r\n");
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}
