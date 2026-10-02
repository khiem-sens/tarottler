import { createClient, type Client, type Row } from "@libsql/client";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import type { ContentDocument, ManagedCard } from "./schema";
import { publishingIssues } from "./schema";
import type { Locale } from "@/features/tarot/lib/language";

export class ContentConflict extends Error {}
export class PublishValidation extends Error {}

function decode(row: Row): ManagedCard {
  return {
    id: String(row.id), locale: row.locale as Locale, document: JSON.parse(String(row.draft)), published: row.published === null ? null : JSON.parse(String(row.published)),
    version: Number(row.version), updatedAt: String(row.updated_at),
    publishedAt: row.published_at === null ? null : String(row.published_at),
  };
}

export class ContentStore {
  constructor(public readonly client: Client) {}

  async initialize(seed: { id: string; locale?: Locale; document: ContentDocument }[]) {
    await this.client.execute(`CREATE TABLE IF NOT EXISTS card_translations (
      id TEXT NOT NULL, locale TEXT NOT NULL CHECK (locale IN ('en', 'vi')), draft TEXT NOT NULL, published TEXT,
      version INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL, published_at TEXT, PRIMARY KEY (id, locale)
    )`);
    const legacy = await this.client.execute("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'card_documents'");
    if (legacy.rows.length) {
      // Copy existing English edits once, retaining the legacy table as a backup.
      await this.client.execute(`INSERT OR IGNORE INTO card_translations
        (id, locale, draft, published, version, updated_at, published_at)
        SELECT id, 'en', draft, published, version, updated_at, published_at FROM card_documents`);
    }
    await this.client.execute(`CREATE TABLE IF NOT EXISTS login_attempts (
      id INTEGER PRIMARY KEY CHECK (id = 1), attempts INTEGER NOT NULL, window_start INTEGER NOT NULL
    )`);
    if (seed.length) await this.client.batch(seed.map(({ id, locale = "en", document }) => ({
      sql: "INSERT OR IGNORE INTO card_translations (id, locale, draft, published, updated_at) VALUES (?, ?, ?, ?, ?)",
      args: [id, locale, JSON.stringify(document), locale === "en" ? JSON.stringify(document) : null, new Date().toISOString()],
    })), "write");
  }

  async list(): Promise<ManagedCard[]> {
    return (await this.client.execute("SELECT * FROM card_translations")).rows.map(decode);
  }

  async get(id: string, locale: Locale = "en"): Promise<ManagedCard | null> {
    const result = await this.client.execute({ sql: "SELECT * FROM card_translations WHERE id = ? AND locale = ?", args: [id, locale] });
    return result.rows[0] ? decode(result.rows[0]) : null;
  }

  async save(id: string, version: number, document: ContentDocument, locale: Locale = "en"): Promise<ManagedCard> {
    const result = await this.client.execute({
      sql: "UPDATE card_translations SET draft = ?, version = version + 1, updated_at = ? WHERE id = ? AND locale = ? AND version = ? RETURNING *",
      args: [JSON.stringify(document), new Date().toISOString(), id, locale, version],
    });
    if (!result.rows[0]) throw new ContentConflict("This card changed in another tab. Reload the saved version before trying again.");
    return decode(result.rows[0]);
  }

  async publish(id: string, version: number, locale: Locale = "en"): Promise<ManagedCard> {
    const transaction = await this.client.transaction("write");
    try {
      const current = await transaction.execute({ sql: "SELECT * FROM card_translations WHERE id = ? AND locale = ?", args: [id, locale] });
      if (!current.rows[0] || Number(current.rows[0].version) !== version) throw new ContentConflict("The saved draft changed. Reload before publishing.");
      const issues = publishingIssues(decode(current.rows[0]).document);
      if (issues.length) throw new PublishValidation(issues.join(" "));
      const now = new Date().toISOString();
      const result = await transaction.execute({
        sql: "UPDATE card_translations SET published = draft, version = version + 1, updated_at = ?, published_at = ? WHERE id = ? AND locale = ? RETURNING *",
        args: [now, now, id, locale],
      });
      await transaction.commit();
      return decode(result.rows[0]);
    } finally { transaction.close(); }
  }

  async allowLogin(now = Date.now()): Promise<boolean> {
    // A database-wide window also works across serverless instances.
    const result = await this.client.execute({
      sql: `INSERT INTO login_attempts (id, attempts, window_start) VALUES (1, 1, ?)
        ON CONFLICT(id) DO UPDATE SET
        attempts = CASE WHEN window_start < ? THEN 1 ELSE attempts + 1 END,
        window_start = CASE WHEN window_start < ? THEN excluded.window_start ELSE window_start END
        RETURNING attempts`,
      args: [now, now - 15 * 60 * 1000, now - 15 * 60 * 1000],
    });
    return Number(result.rows[0].attempts) <= 10;
  }
}

export function createContentClient() {
  const url = process.env.CMS_DATABASE_URL || process.env.TURSO_DATABASE_URL;
  if (!url && process.env.VERCEL) throw new Error("Set CMS_DATABASE_URL or TURSO_DATABASE_URL for a hosted CMS database.");
  if (!url) mkdirSync(join(process.cwd(), ".cms"), { recursive: true });
  return createClient({ url: url ?? `file:${join(process.cwd(), ".cms/content.db")}`, authToken: process.env.CMS_DATABASE_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN });
}
