import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { randomBytes, scryptSync } from "node:crypto";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const directory = await mkdtemp(join(tmpdir(), "tarottler-cms-test-"));
const password = randomBytes(20).toString("hex"), salt = randomBytes(16).toString("hex");
const port = Number(process.env.CMS_TEST_PORT ?? 5180);
const base = `http://localhost:${port}`;
let logs = "";
const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--port", String(port)], {
  env: { ...process.env, CMS_DATABASE_URL: `file:${join(directory, "content.db")}`, CMS_DATABASE_AUTH_TOKEN: "",
    CMS_ADMIN_PASSWORD_HASH: `${salt}:${scryptSync(password, salt, 64).toString("hex")}`,
    CMS_SESSION_SECRET: randomBytes(32).toString("hex"), VERCEL: "" },
  stdio: ["ignore", "pipe", "pipe"],
});
server.stdout.on("data", data => { logs += data; });
server.stderr.on("data", data => { logs += data; });
let cookie = "";
async function request(path, method = "GET", body, origin = base) {
  return fetch(`${base}${path}`, { method, redirect: "manual", headers: {
    Cookie: cookie, Origin: origin, "Content-Type": "application/json",
  }, ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal: AbortSignal.timeout(15000) });
}

try {
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    if (server.exitCode !== null) throw new Error(`Test server failed: ${logs}`);
    try { ready = (await request("/admin/login")).status === 200; } catch { /* Wait for the isolated server to listen. */ }
    if (ready) break;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert(ready, "test server must start");
  assert.equal((await request("/admin")).status, 307);
  assert.equal((await request("/api/admin/cards/RWSa-T-00")).status, 401);
  assert.equal((await request("/api/admin/session", "POST", { password }, "https://different-origin.example")).status, 403);
  assert.equal((await request("/api/admin/session", "POST", { password: "wrong password" })).status, 401);
  const login = await request("/api/admin/session", "POST", { password });
  assert.equal(login.status, 200);
  const setCookie = login.headers.get("set-cookie");
  assert(setCookie?.includes("HttpOnly")); assert(setCookie?.includes("SameSite=strict"));
  cookie = setCookie.split(";")[0];
  const admin = await request("/admin");
  assert.equal(admin.status, 200); assert((await admin.text()).includes("Card library"));
  assert.equal((await request("/api/admin/cards/RWSa-T-00?lang=invalid")).status, 400);
  const entry = await (await request("/api/admin/cards/RWSa-T-00")).json();
  const marker = "CMS integration published meaning: a thoughtful first step with confidence.";
  const privateNote = "CMS integration private note must never appear publicly.";
  entry.document.article.general = marker; entry.document.editorial.notes = privateNote;
  const savedResponse = await request("/api/admin/cards/RWSa-T-00", "PUT", { version: entry.version, document: entry.document });
  assert.equal(savedResponse.status, 200);
  const saved = await savedResponse.json();
  const draftPublic = await (await request("/cards/the-fool")).text();
  assert(!draftPublic.includes(marker)); assert(!draftPublic.includes(privateNote));
  assert.equal((await request("/api/admin/cards/RWSa-T-00", "PUT", { version: entry.version, document: entry.document })).status, 409);
  const publishResponse = await request("/api/admin/cards/RWSa-T-00", "POST", { version: saved.version });
  assert.equal(publishResponse.status, 200);
  const published = await publishResponse.json();
  const publicReading = await (await request("/cards/the-fool")).text();
  assert(publicReading.includes(marker)); assert(!publicReading.includes(privateNote));
  const publicHome = await (await request("/")).text();
  assert(publicHome.includes(marker)); assert(!publicHome.includes(privateNote));
  published.document.article.general = "";
  const incomplete = await (await request("/api/admin/cards/RWSa-T-00", "PUT", { version: published.version, document: published.document })).json();
  assert.equal((await request("/api/admin/cards/RWSa-T-00", "POST", { version: incomplete.version })).status, 422);
  assert((await (await request("/cards/the-fool")).text()).includes(marker));
  const viEntry = await (await request("/api/admin/cards/RWSa-T-00?lang=vi")).json();
  assert.equal(viEntry.published, null);
  const untranslated = await (await request("/cards/the-fool?lang=vi")).text();
  assert(untranslated.includes("Bản tiếng Việt chưa được xuất bản"));
  viEntry.document.article = { ...entry.document.article,
    keywords: ["khởi đầu", "tò mò", "cởi mở"],
    general: "Một khởi đầu mới với sự tò mò và những bước đi có cân nhắc.",
  };
  viEntry.document.editorial.displayName = "Kẻ Khờ thử nghiệm";
  viEntry.document.editorial.notes = privateNote;
  const viSave = await request("/api/admin/cards/RWSa-T-00?lang=vi", "PUT", { version: viEntry.version, document: viEntry.document });
  assert.equal(viSave.status, 200);
  const viSaved = await viSave.json();
  assert((await (await request("/cards/the-fool?lang=vi")).text()).includes("Bản tiếng Việt chưa được xuất bản"));
  assert.equal((await request("/api/admin/cards/RWSa-T-00?lang=vi", "POST", { version: viSaved.version })).status, 200);
  const viPublic = await (await request("/cards/the-fool?lang=vi")).text();
  assert(viPublic.includes(viEntry.document.article.general));
  assert(viPublic.includes("Kẻ Khờ thử nghiệm"));
  assert(!viPublic.includes("Bản tiếng Việt chưa được xuất bản")); assert(!viPublic.includes(privateNote));
  const enEntry = await (await request("/api/admin/cards/RWSa-T-00?lang=en")).json();
  assert.equal(enEntry.version, incomplete.version); assert.equal(enEntry.published.article.general, marker);
  const englishPage = await (await request("/cards/the-fool?lang=en")).text();
  assert(englishPage.includes(`<h2>The Fool</h2>`)); assert(englishPage.includes("What it can suggest"));
  const home = await (await request("/?lang=vi")).text();
  assert(home.includes("Tarotler")); assert(home.includes("Tiếng Việt")); assert(home.includes("Tất cả lá bài"));
  cookie += "; tarotler-language=vi";
  const preferred = await (await request("/cards/the-fool")).text();
  assert(preferred.includes("<h2>Kẻ Khờ thử nghiệm</h2>"));
  const override = await (await request("/cards/the-fool?lang=en")).text();
  assert(override.includes("<h2>The Fool</h2>"));
  assert.equal((await request("/api/admin/session", "DELETE")).status, 200);
  cookie = "";
  assert.equal((await request("/api/admin/cards/RWSa-T-00", "PUT", { version: incomplete.version, document: incomplete.document })).status, 401);
  console.log("CMS integration passed: auth, draft isolation, publish, EN/VI separation, language fallback, branding, conflicts, validation, private notes and logout.");
  console.log("Tests used an isolated temporary database; local CMS articles were not modified.");
} finally {
  server.kill("SIGTERM");
  await new Promise(resolve => { if (server.exitCode !== null) resolve(); else server.once("exit", resolve); });
}

// The public gallery must still load on Vercel before hosted CMS storage is configured.
const fallbackServer = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--port", String(port)], {
  env: { ...process.env, VERCEL: "1", CMS_DATABASE_URL: "", CMS_DATABASE_AUTH_TOKEN: "",
    CMS_ADMIN_PASSWORD_HASH: "", CMS_SESSION_SECRET: "" }, stdio: "ignore",
});
try {
  let response;
  for (let attempt = 0; attempt < 100; attempt++) {
    if (fallbackServer.exitCode !== null) throw new Error("Fallback server exited before responding.");
    try { response = await fetch(`${base}/cards/the-fool?lang=vi`); break; } catch { await new Promise(resolve => setTimeout(resolve, 100)); }
  }
  assert.equal(response?.status, 200);
  const page = await response.text();
  assert(page.includes("Bản tiếng Việt chưa được xuất bản"));
  assert(page.includes("The Fool invites a new start"));
  assert.equal((await fetch(base)).status, 200);
  console.log("Public fallback passed without hosted CMS configuration.");
} finally {
  fallbackServer.kill("SIGTERM");
  await new Promise(resolve => { if (fallbackServer.exitCode !== null) resolve(); else fallbackServer.once("exit", resolve); });
}
