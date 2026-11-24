// A618: Axiom's Web Bot Auth key directory. Public key only, right media type, CORS open, the
// response's own signature valid for deployaxiom.com and in date, and the build copies the file.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash, createPublicKey, verify } from "node:crypto";

const DIR = ".well-known/http-message-signatures-directory";
const doc = JSON.parse(readFileSync(DIR, "utf8"));
const toml = readFileSync("netlify.toml", "utf8");
const block = toml.slice(toml.indexOf('for = "/.well-known/http-message-signatures-directory"'));
const val = (name) => {
  const m = new RegExp("^\\s*" + name + ' = "((?:[^"\\\\]|\\\\.)*)"', "m").exec(block);
  return m ? JSON.parse('"' + m[1] + '"') : null;
};
const b64url = (b) => b.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

test("directory holds exactly one Ed25519 public key, kid = JWK thumbprint, nothing private", () => {
  assert.equal(doc.keys.length, 1);
  const k = doc.keys[0];
  assert.equal(k.kty, "OKP");
  assert.equal(k.crv, "Ed25519");
  assert.ok(!("d" in k), "no private key member");
  for (const jwk of doc.keys) assert.deepEqual(Object.keys(jwk).sort(), ["crv", "kid", "kty", "use", "x"]);
  const thumb = b64url(createHash("sha256").update(JSON.stringify({ crv: k.crv, kty: "OKP", x: k.x })).digest());
  assert.equal(k.kid, thumb);
  assert.equal(k.kid, "KTM1LYy9u857Dgc65zU7hSZxpCD9ivQDTGQHEdIArTc");
});

test("served with the draft's media type, open CORS and a short cache", () => {
  assert.equal(val("Content-Type"), "application/http-message-signatures-directory+json");
  assert.equal(val("Access-Control-Allow-Origin"), "*");
  assert.equal(val("Cache-Control"), "public, max-age=300");
});

test("the response's own signature verifies for deployaxiom.com and is in date", () => {
  const input = val("Signature-Input"), sig = val("Signature");
  const m = /^sig1=(\("@authority";req\)(.*))$/.exec(input);
  assert.ok(m, input);
  assert.match(m[2], /tag="http-message-signatures-directory"/);
  assert.match(m[2], new RegExp('keyid="' + doc.keys[0].kid + '"'));
  const created = Number(/created=(\d+)/.exec(m[2])[1]), expires = Number(/expires=(\d+)/.exec(m[2])[1]);
  const now = Date.now() / 1000;
  assert.ok(created <= now + 60 && expires > now + 3 * 86400, "signature in date with 3+ days left; re-sign (docs/agent-keys.md)");
  const base = '"@authority";req: deployaxiom.com\n"@signature-params": ' + m[1];
  const key = createPublicKey({ key: { kty: "OKP", crv: "Ed25519", x: doc.keys[0].x }, format: "jwk" });
  const bytes = Buffer.from(/^sig1=:([A-Za-z0-9+/=]+):$/.exec(sig)[1], "base64");
  assert.ok(verify(null, Buffer.from(base), key, bytes));
  const mirror = '"@authority";req: mirror.example\n"@signature-params": ' + m[1];
  assert.ok(!verify(null, Buffer.from(mirror), key, bytes), "a copy on another host must fail");
});

test("the build publishes the file under dist/.well-known", () => {
  assert.match(toml, /mkdir -p dist\/\.well-known && cp \.well-known\/http-message-signatures-directory dist\/\.well-known\//);
});
