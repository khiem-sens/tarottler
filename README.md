# Tarotler

An interactive Rider–Waite–Smith tarot gallery with a full-page reading for each of the 78 cards.

## Run locally

Use Node.js 22.13+ and pnpm 11.25.0 (via Corepack).

```bash
corepack pnpm install --frozen-lockfile
corepack pnpm dev
```

Open http://localhost:5173. Portable development uses Next.js; the managed
Sites execution profile retains its Vite/Vinext preview integration.

For a production build, run `corepack pnpm build`, then
`corepack pnpm start`. The production server defaults to port 3000.

## Project structure

```text
src/
  app/                    Next.js routes, root layout and global styles
  features/tarot/
    components/           Gallery and full-screen reading experience
    data/                 Card catalog and 78 reading articles
    lib/                  Article lookup and interpretive metadata
  components/             Shared components and UI primitives
  hooks/                  Shared React hooks
  lib/                    Shared utilities and server integrations
  db/                     Optional database access and schema
public/                   Card artwork, fonts and favicon
docs/
  product/                Product requirements
  architecture.md         Directory ownership and development conventions
scripts/                  Installation, runtime and validation commands
build/                    Cloudflare/Sites build integration source
drizzle/                  Database migrations
examples/                 Optional integration examples
vendor/                   Third-party styles and licenses
```

See [architecture](docs/architecture.md) for placement rules and the
[current PRD](docs/product/RWS_Tarot_Learning_Website_PRD.md) for product scope.

## Content Studio

Run `corepack pnpm cms:setup`, restart the dev server, and open `/admin`.
Local login details are saved in `.cms/admin-credentials.txt` (ignored by Git).
The CMS supports draft editing, preview, publishing and private editorial notes.
Each card has independent English and Vietnamese drafts. Gallery language
switching uses EN/VI; Vietnamese readings fall back to English until published.
See [CMS setup and deployment](docs/cms.md) for database and authentication settings.

## Validation

```bash
corepack pnpm validate:content
corepack pnpm typecheck
corepack pnpm lint
corepack pnpm build
```

Card images derive from the Pam-A scans in [Steve P's collection](https://steve-p.org/cards/RWSa.html). The source URLs are recorded in `src/features/tarot/data/cards.json`.

## Deploy on Vercel

Import this repository as a Next.js project. Vercel uses `pnpm build`.
Configure a hosted CMS database and admin environment variables as described
in [CMS deployment](docs/cms.md#deployment) before enabling the site.
