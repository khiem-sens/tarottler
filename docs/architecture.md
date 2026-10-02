# Project Architecture

Tarotler uses the Next.js App Router with feature-owned application code
under `src/`. The `@/` alias resolves to `src/`.

## Routes and Features

`src/app/` owns route entry points, the root layout, document metadata and
global styles. Route modules compose feature components; they do not own
the tarot catalog or reading logic.

`src/features/tarot/` owns the tarot experience:

- `components/tarot-explorer.tsx`: client-side gallery, search/filter,
  pointer interaction, reading sheet and browser history handling.
- `data/cards.json`: ordered catalog, image paths, aliases and source URLs.
- `data/card-content.json`: English articles, keyed by card name.
- `lib/card-detail.ts`: article type and lookup.
- `lib/card-metadata.ts`: arcana, element, zodiac and yes/no associations.

Both `/` and `/cards/[slug]` render the same explorer. The card route
validates the slug and provides the initial card ID. Card navigation and
closing behavior remain owned by the explorer.

Keep code used only by tarot inside this feature. `src/features/cms/` owns
the separate admin workflow: studio components, authentication, validation
and libSQL draft/published storage. Routes under `src/app/admin/` and
`src/app/api/admin/` compose this feature. See [CMS setup](cms.md).

## Shared Source

- `src/components/ui/` contains the supplied UI primitives. Preserve their
  registry conventions and the aliases in `components.json`.
- `src/components/` contains cross-feature components.
- `src/hooks/` contains hooks shared across features.
- `src/lib/` contains shared utilities and server integrations. Database
  access, authentication and connector context belong in server code,
  not in client-side feature imports.
- `src/db/` contains optional Cloudflare D1 access and the currently empty
  application schema. Drizzle reads `src/db/schema.ts` and writes migrations
  to `drizzle/`.

Use `@/` imports between source areas, and relative imports for nearby files
within a feature. Public asset URLs remain `/cards/...` and `/fonts/...`;
moving source files must not change those URLs. Typography uses the system
Helvetica Neue family across the Gallery, reading sheet and CMS, with Helvetica,
Arial and sans-serif fallbacks. The old font assets are no longer loaded.

## Tooling and Documentation

Framework configuration, `package.json` and the lockfile stay at the root.
`scripts/` owns developer commands and content validation. `build/` contains
checked-in Sites/Cloudflare tooling, not generated build output; generated
`.next/`, `dist/` and local runtime state are ignored.

`examples/` contains opt-in integration samples, and `vendor/` contains
third-party assets and their licenses. Neither is application route code.
Product requirements live in `docs/product/`; technical conventions live
in `docs/` and the root README links to both.

## Running and Checking Changes

Use Node.js 22.13+ and the package-manager version pinned in `package.json`.
Install with `corepack pnpm install --frozen-lockfile`.

Portable `corepack pnpm dev` uses Next.js on port 5173; pass another port
with `corepack pnpm dev --port 5174` if needed. `corepack pnpm build` produces
a Next.js production build and `corepack pnpm start` serves it. The existing
managed Sites execution profile continues to use Vite/Vinext for preview.
`preview:worker` is reserved for a separately generated Cloudflare worker
build under `dist/server/`.

Run `validate:content` after changing the catalog or articles. Run
`typecheck`, `lint` and `build` after changing source paths or configuration.
For UI changes, also verify the gallery and direct card routes in a browser,
including search/filter, history navigation and mobile reading layout.
