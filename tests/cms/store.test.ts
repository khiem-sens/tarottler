import test from "node:test";
import assert from "node:assert/strict";
import { createClient } from "@libsql/client";
import { ContentStore, ContentConflict, PublishValidation } from "../../src/features/cms/lib/store";
import { documentSchema, type ContentDocument } from "../../src/features/cms/lib/schema";

const seed: ContentDocument = {
  article: { keywords: ["one", "two", "three"], image: "A traveler, a white dog and a bright sun.", general: "A fresh beginning with care and curiosity.", love: "Be open while respecting your boundaries.", work: "Start a small experiment before committing.", money: "Check the costs before starting something.", reflection: "What first step feels exciting and grounded?" },
  editorial: { altText: "The Fool", references: "Original scan", notes: "Private editorial note", origin: "unspecified", reviewStatus: "unreviewed" },
};

async function fixture() {
  const store = new ContentStore(createClient({ url: "file::memory:" }));
  await store.initialize([{ id: "fool", document: seed }]);
  return store;
}

test("draft changes do not change published content; publishing promotes the saved draft", async () => {
  const store = await fixture();
  try {
    const draft = structuredClone(seed); draft.article.general = "An edited interpretation that stays private until published.";
    const saved = await store.save("fool", 0, draft);
    assert.equal(saved.version, 1); assert.deepEqual(saved.published, seed);
    const published = await store.publish("fool", 1);
    assert.equal(published.version, 2); assert.deepEqual(published.published, draft);
    assert.ok(published.publishedAt);
    await store.initialize([{ id: "fool", document: seed }]);
    assert.deepEqual((await store.get("fool"))?.published, draft, "reinitialization must not overwrite edited content");
  } finally { store.client.close(); }
});

test("stale editors cannot overwrite a draft or publish a different revision", async () => {
  const store = await fixture();
  try {
    await store.save("fool", 0, seed);
    await assert.rejects(store.save("fool", 0, seed), ContentConflict);
    await assert.rejects(store.publish("fool", 0), ContentConflict);
    assert.equal((await store.get("fool"))?.version, 1);
  } finally { store.client.close(); }
});

test("incomplete drafts can be saved but cannot replace the public article", async () => {
  const store = await fixture();
  try {
    const draft = structuredClone(seed); draft.article.general = ""; draft.article.keywords = [];
    await store.save("fool", 0, draft);
    await assert.rejects(store.publish("fool", 1), PublishValidation);
    assert.deepEqual((await store.get("fool"))?.published, seed);
    assert.equal((await store.get("fool"))?.version, 1);
  } finally { store.client.close(); }
});

test("login throttling is persisted and resets after the window", async () => {
  const store = await fixture();
  try {
    for (let i = 0; i < 10; i++) assert.equal(await store.allowLogin(1000000), true);
    assert.equal(await store.allowLogin(1000001), false);
    assert.equal(await store.allowLogin(1900001), true);
  } finally { store.client.close(); }
});

test("editor input rejects invalid metadata, too many keywords and oversized fields", () => {
  assert.equal(documentSchema.safeParse(seed).success, true);
  assert.equal(documentSchema.safeParse({ ...seed, article: { ...seed.article, keywords: Array(7).fill("word") } }).success, false);
  assert.equal(documentSchema.safeParse({ ...seed, article: { ...seed.article, general: "a".repeat(12001) } }).success, false);
  assert.equal(documentSchema.safeParse({ ...seed, editorial: { ...seed.editorial, origin: "invalid" } }).success, false);
});

test("English and Vietnamese revisions and published documents are independent", async () => {
  const store = await fixture();
  try {
    const vietnamese = structuredClone(seed);
    vietnamese.article.general = "Một khởi đầu mới với sự tò mò và những bước đi có cân nhắc.";
    vietnamese.editorial.displayName = "Kẻ Khờ";
    await store.initialize([{ id: "fool", locale: "vi", document: vietnamese }]);
    assert.equal((await store.get("fool", "vi"))?.published, null);
    const saved = await store.save("fool", 0, vietnamese, "vi");
    await store.publish("fool", saved.version, "vi");
    assert.deepEqual((await store.get("fool", "en"))?.published, seed);
    assert.equal((await store.get("fool", "en"))?.version, 0);
    assert.deepEqual((await store.get("fool", "vi"))?.published, vietnamese);
    await assert.rejects(store.save("fool", 0, vietnamese, "vi"), ContentConflict);
    await store.save("fool", 0, seed, "en");
    assert.equal((await store.get("fool", "en"))?.version, 1);
  } finally { store.client.close(); }
});

test("migration preserves existing English drafts, published content and revisions", async () => {
  const store = new ContentStore(createClient({ url: "file::memory:" }));
  try {
    const oldDraft = structuredClone(seed); oldDraft.editorial.notes = "Existing unsaved-to-public editorial changes";
    await store.client.execute("CREATE TABLE card_documents (id TEXT PRIMARY KEY, draft TEXT, published TEXT, version INTEGER, updated_at TEXT, published_at TEXT)");
    await store.client.execute({ sql: "INSERT INTO card_documents VALUES (?, ?, ?, ?, ?, ?)", args: ["fool", JSON.stringify(oldDraft), JSON.stringify(seed), 7, "2026-10-01T00:00:00Z", "2026-09-30T00:00:00Z"] });
    await store.initialize([{ id: "fool", document: seed }, { id: "fool", locale: "vi", document: seed }]);
    const migrated = await store.get("fool");
    assert.deepEqual(migrated?.document, oldDraft); assert.deepEqual(migrated?.published, seed);
    assert.equal(migrated?.version, 7); assert.equal(migrated?.publishedAt, "2026-09-30T00:00:00Z");
    const edited = structuredClone(seed); edited.article.general = "A newer edited interpretation after database migration.";
    await store.save("fool", 7, edited);
    await store.initialize([{ id: "fool", document: seed }]);
    assert.equal((await store.get("fool"))?.version, 8);
    assert.deepEqual((await store.get("fool"))?.document, edited);
    assert.equal((await store.get("fool", "vi"))?.published, null);
  } finally { store.client.close(); }
});
