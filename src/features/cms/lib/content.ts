import "server-only";
import cards from "@/features/tarot/data/cards.json";
import articles from "@/features/tarot/data/card-content.json";
import type { CardArticle, PublishedArticles } from "@/features/tarot/lib/card-detail";
import { cardName } from "@/features/tarot/lib/language";
import { ContentStore, createContentClient } from "./store";

let storePromise: Promise<ContentStore> | undefined;

export function getContentStore(): Promise<ContentStore> {
  if (!storePromise) {
    storePromise = (async () => {
      const store = new ContentStore(createContentClient());
      await store.initialize(cards.flatMap(card => (["en", "vi"] as const).map(locale => ({ id: card.id, locale, document: {
        article: locale === "en" ? (articles as Record<string, CardArticle>)[card.name] : {
          keywords: [], image: "", general: "", love: "", work: "", money: "", reflection: "",
        },
        editorial: {
          displayName: cardName(card, locale), altText: `${cardName(card, locale)}, Rider-Waite-Smith tarot`, references: card.source,
          notes: "", origin: "unspecified" as const, reviewStatus: "unreviewed" as const,
        },
      } }))));
      return store;
    })().catch(error => { storePromise = undefined; throw error; });
  }
  return storePromise;
}

export async function publishedArticles(): Promise<PublishedArticles> {
  if (process.env.VERCEL && !process.env.CMS_DATABASE_URL) {
    const english = Object.fromEntries(cards.map(card => [card.name, {
      ...(articles as Record<string, CardArticle>)[card.name], contentLanguage: "en" as const,
    }]));
    return { en: english, vi: english };
  }
  const documents = await (await getContentStore()).list();
  const translations: PublishedArticles = { en: {}, vi: {} };
  for (const card of cards) {
    const english = documents.find(item => item.id === card.id && item.locale === "en")?.published;
    if (!english) throw new Error(`Missing published content for ${card.name}`);
    for (const locale of ["en", "vi"] as const) {
      const translated = documents.find(item => item.id === card.id && item.locale === locale)?.published;
      const document = translated ?? english;
      translations[locale][card.name] = {
        ...document.article, altText: document.editorial.altText, title: document.editorial.displayName,
        contentLanguage: translated ? locale : "en",
      };
    }
  }
  return translations;
}
