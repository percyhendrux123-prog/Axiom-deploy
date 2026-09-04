import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";
import handler, { ownedEntries, verifyMetaSignature } from "../netlify/functions/meta-webhook.mjs";

const env = {
  META_WEBHOOK_VERIFY_TOKEN: "verify-token",
  META_APP_SECRET: "app-secret",
  PKFIT_INSTAGRAM_ACCOUNT_ID: "28067504846192877",
  PKFIT_FACEBOOK_PAGE_ID: "1612598710577645",
  HERMES_META_INGEST_SECRET: "ingest-secret",
  HERMES_META_INGEST_URL: "https://example.test/hooks/pkfit-meta-stage",
};
Object.assign(process.env, env);

test("answers Meta GET challenge only for the configured token", async () => {
  const ok = await handler(new Request("https://deployaxiom.com/api/meta/webhook?hub.mode=subscribe&hub.verify_token=verify-token&hub.challenge=proof"));
  assert.equal(ok.status, 200);
  assert.equal(await ok.text(), "proof");

  const denied = await handler(new Request("https://deployaxiom.com/api/meta/webhook?hub.mode=subscribe&hub.verify_token=wrong&hub.challenge=proof"));
  assert.equal(denied.status, 403);
});

test("verifies Meta SHA-256 signatures", () => {
  const body = '{"object":"instagram","entry":[]}';
  const signature = `sha256=${createHmac("sha256", env.META_APP_SECRET).update(body).digest("hex")}`;
  assert.equal(verifyMetaSignature(body, signature, env.META_APP_SECRET), true);
  assert.equal(verifyMetaSignature(body, "sha256=bad", env.META_APP_SECRET), false);
});

test("keeps owned entries and rejects unrelated accounts", () => {
  const payload = { object: "instagram", entry: [{ id: env.PKFIT_INSTAGRAM_ACCOUNT_ID }, { id: "other" }] };
  assert.deepEqual(ownedEntries(payload, env.PKFIT_INSTAGRAM_ACCOUNT_ID, env.PKFIT_FACEBOOK_PAGE_ID), [{ id: env.PKFIT_INSTAGRAM_ACCOUNT_ID }]);
});

test("rejects unsigned POSTs", async () => {
  const result = await handler(new Request("https://deployaxiom.com/api/meta/webhook", { method: "POST", body: "{}" }));
  assert.equal(result.status, 401);
});

test("forwards owned signed events with Hermes HMAC and stable request ID", async (t) => {
  const body = JSON.stringify({ object: "instagram", entry: [{ id: env.PKFIT_INSTAGRAM_ACCOUNT_ID, time: 1, changes: [{ field: "comments", value: { id: "c1" } }] }] });
  const signature = `sha256=${createHmac("sha256", env.META_APP_SECRET).update(body).digest("hex")}`;
  let seen;
  t.mock.method(globalThis, "fetch", async (url, init) => {
    seen = { url, init };
    return new Response('{"status":"accepted"}', { status: 200 });
  });
  const result = await handler(new Request("https://deployaxiom.com/api/meta/webhook", { method: "POST", headers: { "x-hub-signature-256": signature }, body }));
  assert.equal(result.status, 200);
  assert.equal((await result.json()).forwarded, true);
  assert.equal(seen.url, env.HERMES_META_INGEST_URL);
  assert.match(seen.init.headers["x-webhook-signature"], /^[a-f0-9]{64}$/);
  assert.match(seen.init.headers["x-request-id"], /^[a-f0-9]{64}$/);
});
