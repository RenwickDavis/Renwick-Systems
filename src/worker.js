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
const FORM_FIELDS = new Set([...Object.keys(LIMITS), "offer", "website"]);
const FORM_TYPES = new Set(["application/x-www-form-urlencoded", "multipart/form-data"]);
const MAX_BODY_BYTES = 64 * 1024;
const SINGLE_LINE_CONTROLS = /[\x00-\x1f\x7f-\x9f\u2028\u2029]/;
const MESSAGE_CONTROLS = /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]/;
const EMAIL_LOCAL = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]{1,64}$/i;
const DOMAIN_LABEL = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i;
const UNAVAILABLE = "The form is not available right now. Please email hello@renwicksystems.com.";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/start") {
      if (request.method !== "POST") return json({ ok: false, error: "Use POST." }, 405, { Allow: "POST" });
      return handleStart(request, env, url.origin);
    }
    return env.ASSETS.fetch(request);
  },
};

async function handleStart(request, env, siteOrigin) {
  const origin = request.headers.get("Origin");
  const fetchSite = request.headers.get("Sec-Fetch-Site");
  if ((origin !== null && origin !== siteOrigin) || fetchSite === "cross-site") {
    return json({ ok: false, error: "Please submit the form from this website." }, 403);
  }

  const contentType = request.headers.get("Content-Type") || "";
  const mimeType = contentType.split(";", 1)[0].trim().toLowerCase();
  const encoding = request.headers.get("Content-Encoding");
  if (!FORM_TYPES.has(mimeType) || (encoding && encoding.toLowerCase() !== "identity")) {
    return json({ ok: false, error: "Please submit the project inquiry form." }, 415);
  }

  const tooLarge = "This inquiry is too large. Please shorten your message and try again.";
  if (Number(request.headers.get("Content-Length")) > MAX_BODY_BYTES) {
    return json({ ok: false, error: tooLarge }, 413);
  }

  // Cloudflare supplies this header on public requests. Use one shared bucket if it is absent.
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  try {
    const { success } = await env.START_LIMITER.limit({ key: `start:${ip}` });
    if (!success) {
      const error = "Too many submissions. Please wait one minute and try again.";
      return json({ ok: false, error }, 429, { "Retry-After": "60" });
    }
  } catch {
    console.error("START_LIMITER is unavailable.");
    return json({ ok: false, error: UNAVAILABLE }, 503);
  }

  let form;
  try {
    const bytes = await readFormBody(request.body);
    if (!bytes) return json({ ok: false, error: tooLarge }, 413);
    form = await new Response(bytes, { headers: { "Content-Type": contentType } }).formData();
  } catch {
    return json({ ok: false, error: "The form could not be read." }, 400);
  }

  const fields = new Map();
  for (const [name, value] of form) {
    if (!FORM_FIELDS.has(name) || fields.has(name) || typeof value !== "string") {
      return json({ ok: false, error: "The form has invalid fields. Please reload and try again." }, 400);
    }
    fields.set(name, value);
  }

  // Silently discard submissions that fill the hidden spam trap.
  if (fields.get("website")?.trim()) return json({ ok: true });

  const data = {};
  for (const [name, limit] of Object.entries(LIMITS)) {
    const multiline = name === "message";
    const raw = fields.get(name) ?? "";
    const value = multiline ? raw.replace(/\r\n?/g, "\n") : raw;
    const controls = multiline ? MESSAGE_CONTROLS : SINGLE_LINE_CONTROLS;
    if (controls.test(value)) {
      return json({ ok: false, error: "One of the fields contains unsupported characters." }, 400);
    }
    if (value.length > limit) return json({ ok: false, error: "One of the fields is too long." }, 400);

    data[name] = value.trim();
    if (!data[name]) return json({ ok: false, error: "Please fill in every field." }, 400);
  }
  if (!isEmailAddress(data.email)) return json({ ok: false, error: "Please check your email address." }, 400);

  data.offer = fields.get("offer")?.trim();
  if (!Object.hasOwn(OFFERS, data.offer)) return json({ ok: false, error: "Please choose a package." }, 400);

  const to = env.START_TO;
  if (!to) {
    console.error("START_TO is not set; the form cannot be delivered.");
    return json({ ok: false, error: UNAVAILABLE }, 503);
  }

  try {
    await env.START_MAIL.send(new EmailMessage(FROM, to, buildMessage({ to, data })));
  } catch {
    console.error("START_MAIL could not deliver the inquiry.");
    return json({ ok: false, error: "Your message could not be sent. Please email hello@renwicksystems.com." }, 502);
  }
  return json({ ok: true });
}

// Check the stream as well as Content-Length, which may be absent.
async function readFormBody(body) {
  const bytes = new Uint8Array(MAX_BODY_BYTES);
  if (!body) return bytes.subarray(0, 0);

  const reader = body.getReader();
  let length = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) return bytes.subarray(0, length);
      if (value.byteLength > MAX_BODY_BYTES - length) {
        void reader.cancel().catch(() => {});
        return null;
      }
      bytes.set(value, length);
      length += value.byteLength;
    }
  } finally {
    reader.releaseLock();
  }
}

function isEmailAddress(email) {
  const [local, domain, extra] = email.split("@");
  if (extra !== undefined || !domain?.includes(".") || !EMAIL_LOCAL.test(local)) return false;
  if (local.startsWith(".") || local.endsWith(".") || local.includes("..")) return false;
  return domain.split(".").every((label) => DOMAIN_LABEL.test(label));
}

function buildMessage({ to, data }) {
  const offer = OFFERS[data.offer];
  const subject = `Discovery request: ${data.company} (${offer})`;
  const body = [
    "A new request came in through the form on renwicksystems.com.",
    "",
    `Name:         ${data.firstname}`,
    `Business:     ${data.company}`,
    `Email:        ${data.email}`,
    `Interested in: ${offer}`,
    "",
    "What they need to be right:",
    data.message.replace(/\n/g, "\r\n"),
    "",
    `Received ${new Date().toUTCString()}.`,
    "Reply to this email to answer them directly.",
  ].join("\r\n");

  const headers = [
    `From: Renwick Systems website <${FROM}>`,
    `To: <${to}>`,
    `Reply-To: <${data.email}>`,
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

function json(obj, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      ...extraHeaders,
    },
  });
}
