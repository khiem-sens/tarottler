import TarotExplorer from "@/features/tarot/components/tarot-explorer";
import { publishedArticles } from "@/features/cms/lib/content";
import { galleryLocale } from "@/features/tarot/lib/server-language";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function HomePage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const { lang } = await searchParams;
  return <TarotExplorer translations={await publishedArticles()} initialLocale={await galleryLocale(lang)} />;
}
