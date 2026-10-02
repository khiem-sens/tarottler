# Content Studio

The single-admin CMS is available at `/admin`. The studio lists all 78 cards
and supports reading edits, image alt text, reference sources, private notes,
content origin, editorial review, draft preview, saving and publishing.

## English and Vietnamese

Use the EN/VI content-language control to edit a card's English or Vietnamese
document. Card display name, reading sections, keywords, alt text, references
and private notes are stored separately for each language. Save, Publish,
revision conflicts and browser recovery all apply to the selected language;
publishing Vietnamese does not change the English article.

Existing English content and revisions are migrated into `card_translations`
without resetting them. The original `card_documents` table is retained as a
legacy backup. Vietnamese starts as an unpublished draft with a localized
card name; the 78 reading articles have not been automatically translated.

The Gallery EN/VI switch localizes controls, card names and reading headings,
preserves the current gallery state, and saves the preference in a cookie.
The `?lang=en` or `?lang=vi` URL parameter overrides the cookie, including on
direct card URLs. If a Vietnamese article has not been published, the English
article is shown with a Vietnamese fallback notice. Unpublished translations
and private notes are never included in public page props.

## Local Setup

```bash
corepack pnpm install --frozen-lockfile
corepack pnpm cms:setup
corepack pnpm dev
```

Setup generates a random admin password, a salted scrypt password hash and
a session secret. The hash and secret are written to `.env.local`; local
login details are in `.cms/admin-credentials.txt`. Both locations are ignored
by Git. Restart the server after configuring environment variables.

Local storage uses `.cms/content.db`. Keep this file on persistent disk and
include it in backups. Initial readings are seeded from the JSON catalog on
first use; subsequent starts do not overwrite edits.

## Drafts and Publishing

Each card stores a working draft, its published document and a revision number.
Saving a draft does not change the public reading. Preview renders the current
editor values, including unsaved edits. Publishing promotes the saved draft
in a transaction; save unsaved edits first. The public site reads the published
article at request time, so reload the gallery or card URL after publishing.

Publishing requires 3–6 non-empty keywords, at least 25 characters in each
reading section, and image alt text. Drafts can contain incomplete reading
sections. Review status is recorded separately and is not a publishing gate.
Private notes are never included in public page props.

Concurrent saves use optimistic revision checks. A stale editor receives a
conflict rather than overwriting a newer draft. Use Reload saved version to
get the latest revision. The browser also keeps a recovery copy of edits;
Restore is explicit so a recovered draft cannot silently replace server data.
Browser recovery is best-effort and does not replace saving to the database.

## Authentication

Admin routes and mutation APIs check the signed, HTTP-only session cookie.
Sessions expire after eight hours. Login and mutation endpoints check Origin;
cookies use SameSite Strict and HTTPS requests receive Secure cookies.
Login is limited to ten attempts per fifteen-minute database-wide window.
Changing the session secret invalidates existing sessions.

This release provides one password-based admin, not visitor accounts or a
multi-user permissions system. For a shared computer, dismiss browser recovery
copies after finishing private edits.

## Deployment

The CMS runs in the Next.js Node.js runtime. For a persistent Node server,
either keep the local database on a durable disk or configure a hosted database.
Vercel deployments require a hosted libSQL database; a local file is not a
persistent serverless datastore. Set these environment variables:

- `CMS_DATABASE_URL`: hosted database URL.
- `CMS_DATABASE_AUTH_TOKEN`: database access token.
- `CMS_ADMIN_PASSWORD_HASH`: salted hash produced by setup.
- `CMS_SESSION_SECRET`: random secret produced by setup, at least 32 characters.

The storage adapter uses the official [libSQL client](https://github.com/tursodatabase/libsql-client-ts).
No hosted database or deployment has been provisioned by this implementation.
Cloudflare D1 scaffolding remains separate; the CMS currently does not use it.

## Verification

```bash
corepack pnpm test:cms
corepack pnpm lint
corepack pnpm build
corepack pnpm test:cms:integration
```

The integration check starts an isolated production server on port 5180 and
uses a temporary database and test credentials. Override `CMS_TEST_PORT` if
the port is occupied. It verifies authentication, draft/public separation,
publishing, version conflicts, incomplete-content rejection, private-note
isolation and logout without modifying the local CMS database.

Remaining manual QA: desktop/mobile editing, keyboard navigation, recovery
after browser refresh, failed-network feedback and screen-reader use. The
preview is a studio reading preview, not an exact replica of the public sheet.
