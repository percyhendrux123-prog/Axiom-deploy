import { createHash, createHmac, timingSafeEqual } from "node:crypto";

const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  "x-content-type-options": "nosniff",
};

function response(status, body, headers = JSON_HEADERS) {
  return new Response(typeof body === "string" ? body : JSON.stringify(body), {
    status,
    headers,
  });
}

function safeEqual(left, right) {
  const a = Buffer.from(left || "");
  const b = Buffer.from(right || "");
  return a.length === b.length && timingSafeEqual(a, b);
}

function verifyMetaSignature(rawBody, signature, appSecret) {
  if (!signature?.startsWith("sha256=") || !appSecret) return false;
  const expected = `sha256=${createHmac("sha256", appSecret).update(rawBody).digest("hex")}`;
  return safeEqual(signature, expected);
}

function ownedEntries(payload, instagramAccountId, facebookPageId) {
  const allowed = new Set([instagramAccountId, facebookPageId].filter(Boolean));
  if (!["instagram", "page"].includes(payload?.object) || !Array.isArray(payload?.entry)) return [];
  return payload.entry.filter((entry) => allowed.has(String(entry?.id || "")));
}

export default async function handler(request) {
  const url = new URL(request.url);

  if (request.method === "GET") {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");
    if (mode === "subscribe" && challenge && safeEqual(token, process.env.META_WEBHOOK_VERIFY_TOKEN)) {
      return response(200, challenge, { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" });
    }
    return response(403, { accepted: false });
  }

  if (request.method !== "POST") {
    return response(405, { accepted: false }, { ...JSON_HEADERS, allow: "GET, POST" });
  }

  const rawBody = await request.text();
  if (!verifyMetaSignature(rawBody, request.headers.get("x-hub-signature-256"), process.env.META_APP_SECRET)) {
    return response(401, { accepted: false });
  }

  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return response(400, { accepted: false });
  }

  const entries = ownedEntries(
    payload,
    process.env.PKFIT_INSTAGRAM_ACCOUNT_ID,
    process.env.PKFIT_FACEBOOK_PAGE_ID,
  );
  if (entries.length === 0) return response(200, { accepted: true, forwarded: false });

  const filtered = { object: payload.object, entry: entries };
  const forwardBody = JSON.stringify(filtered);
  const requestId = createHash("sha256").update(forwardBody).digest("hex");
  const forwardSecret = process.env.HERMES_META_INGEST_SECRET;
  const forwardUrl = process.env.HERMES_META_INGEST_URL;
  if (!forwardSecret || !forwardUrl) return response(503, { accepted: false });

  const forwardSignature = createHmac("sha256", forwardSecret).update(forwardBody).digest("hex");
  const forwarded = await fetch(forwardUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-webhook-signature": forwardSignature,
      "x-request-id": requestId,
    },
    body: forwardBody,
    signal: AbortSignal.timeout(8000),
  });

  if (!forwarded.ok) return response(502, { accepted: false });
  return response(200, { accepted: true, forwarded: true });
}

export const config = { path: "/api/meta/webhook" };
export { ownedEntries, verifyMetaSignature };
