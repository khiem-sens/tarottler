import test from "node:test";
import assert from "node:assert/strict";
import { scryptSync } from "node:crypto";
import { createSession, sessionSeconds, verifyPassword, verifySession } from "../../src/features/cms/lib/session";

test("signed sessions reject tampering, wrong secrets and expiration", () => {
  const secret = "a".repeat(64), now = 100000;
  const token = createSession(secret, now);
  assert.equal(verifySession(token, secret, now), true);
  assert.equal(verifySession(token, "b".repeat(64), now), false);
  assert.equal(verifySession(`x${token}`, secret, now), false);
  assert.equal(verifySession(token, secret, now + sessionSeconds * 1000), false);
  assert.equal(verifySession(undefined, secret, now), false);
  assert.equal(verifySession(token, "short", now), false);
});

test("admin passwords are checked against the salted scrypt hash", () => {
  const hash = `test-salt:${scryptSync("correct password", "test-salt", 64).toString("hex")}`;
  assert.equal(verifyPassword("correct password", hash), true);
  assert.equal(verifyPassword("incorrect password", hash), false);
  assert.equal(verifyPassword("correct password", "malformed"), false);
});
