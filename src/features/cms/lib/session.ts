import { createHmac, scryptSync, timingSafeEqual } from "node:crypto";

export const sessionCookie = "tarottler-admin";
export const sessionSeconds = 8 * 60 * 60;

export function verifyPassword(password: string, encoded: string): boolean {
  const [salt, hex] = encoded.split(":");
  if (!salt || !hex || !/^[a-f0-9]{128}$/.test(hex)) return false;
  const actual = scryptSync(password, salt, 64);
  return timingSafeEqual(actual, Buffer.from(hex, "hex"));
}

export function createSession(secret: string, now = Date.now()): string {
  const payload = Buffer.from(JSON.stringify({ expires: now + sessionSeconds * 1000 })).toString("base64url");
  return `${payload}.${createHmac("sha256", secret).update(payload).digest("base64url")}`;
}

export function verifySession(token: string | undefined, secret: string | undefined, now = Date.now()): boolean {
  if (!token || !secret || secret.length < 32) return false;
  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra) return false;
  const expected = createHmac("sha256", secret).update(payload).digest();
  const actual = Buffer.from(signature, "base64url");
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return false;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    return typeof data.expires === "number" && data.expires > now && data.expires <= now + sessionSeconds * 1000;
  } catch { return false; }
}
