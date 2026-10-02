import { randomBytes, scryptSync } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const envPath = join(process.cwd(), ".env.local");
const existing = (existsSync(envPath) ? readFileSync(envPath, "utf8") : "")
  .replace(/^CMS_(?:ADMIN_PASSWORD_HASH|SESSION_SECRET)=[ \t]*$/gm, "");
if (/^CMS_ADMIN_PASSWORD_HASH=/m.test(existing) || /^CMS_SESSION_SECRET=/m.test(existing)) {
  console.log("CMS credentials already exist in .env.local; nothing was changed.");
  process.exit(0);
}
const password = randomBytes(18).toString("base64url");
const salt = randomBytes(16).toString("hex");
const hash = `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
const secret = randomBytes(32).toString("hex");
mkdirSync(".cms", { recursive: true });
writeFileSync(envPath, `${existing}${existing.endsWith("\n") || !existing ? "" : "\n"}CMS_ADMIN_PASSWORD_HASH=${hash}\nCMS_SESSION_SECRET=${secret}\n`, { mode: 0o600 });
writeFileSync(".cms/admin-credentials.txt", `Tarotler local CMS\nURL: http://localhost:5173/admin\nPassword: ${password}\n\nKeep this file private. The password hash and session secret are in .env.local.\n`, { mode: 0o600 });
console.log("CMS configured. Local login details: .cms/admin-credentials.txt. Restart the dev server to load the environment.");
