import { z } from "zod";
import { locales } from "@/features/tarot/lib/language";

export const localeSchema = z.enum(locales);

export const readingFields = ["image", "general", "love", "work", "money", "reflection"] as const;
export const fieldLabels = {
  image: "In the image", general: "What it can suggest", love: "Love & relationships",
  work: "Work & study", money: "Money", reflection: "For reflection",
};
const text = z.string().max(12000);
export const documentSchema = z.object({
  article: z.object({
    keywords: z.array(z.string().max(80)).max(6),
    image: text, general: text, love: text, work: text, money: text, reflection: text,
  }),
  editorial: z.object({
    displayName: z.string().max(120).optional(),
    altText: z.string().max(500),
    references: z.string().max(5000),
    notes: text,
    origin: z.enum(["unspecified", "ai-generated", "human"]),
    reviewStatus: z.enum(["unreviewed", "reviewed"]),
  }),
});
export const mutationSchema = z.object({ version: z.number().int().nonnegative(), document: documentSchema });
export type ContentDocument = z.infer<typeof documentSchema>;
export type ManagedCard = {
  id: string; locale: z.infer<typeof localeSchema>; document: ContentDocument; published: ContentDocument | null;
  version: number; updatedAt: string; publishedAt: string | null;
};
export const managedCardSchema = z.object({
  id: z.string(), locale: localeSchema, document: documentSchema, published: documentSchema.nullable(),
  version: z.number().int(), updatedAt: z.string(), publishedAt: z.string().nullable(),
});
export const loginSchema = z.object({ password: z.string().min(1).max(256) });
export const errorSchema = z.object({ error: z.string() });

export function publishingIssues(document: ContentDocument): string[] {
  const issues: string[] = [];
  if (document.article.keywords.length < 3 || document.article.keywords.some(word => !word.trim())) {
    issues.push("Add 3 to 6 non-empty keywords.");
  }
  for (const field of readingFields) {
    if (document.article[field].trim().length < 25) issues.push(`${fieldLabels[field]} needs at least 25 characters.`);
  }
  if (!document.editorial.altText.trim()) issues.push("Add image alt text.");
  return issues;
}
