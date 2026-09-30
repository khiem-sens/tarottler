# Tarottler

An interactive Rider–Waite–Smith tarot gallery with a full-page reading for each of the 78 cards.

## Run locally

Use Node.js 22.13+ and pnpm 11.25.0.

```bash
pnpm install
pnpm dev
```

For a production build, run `pnpm build`.

## Project structure

- `app/page.tsx`: gallery, search/filter, cursors, detail drawer and card navigation.
- `app/globals.css`: shared design tokens, typography, layout and motion.
- `app/cards.json` and `app/card-content.json`: card order, imagery and articles.
- `app/card-metadata.ts`: arcana, element, zodiac and interpretive yes/no cues.
- `public/cards/`: optimized WebP artwork, including responsive variants.
- `public/fonts/`: the supplied Saans and Neue Haas Display font files.

Card images derive from the Pam-A scans in [Steve P's collection](https://steve-p.org/cards/RWSa.html). The source URLs are recorded in `app/cards.json`.

## Deploy on Vercel

Import this repository as a Next.js project. Vercel uses `pnpm build` and serves the app without environment variables.
