import "server-only";
import { cookies } from "next/headers";
import { isLocale, languageCookie, type Locale } from "./language";

export async function galleryLocale(value?: string | string[]): Promise<Locale> {
  if (isLocale(value)) return value;
  const saved = (await cookies()).get(languageCookie)?.value;
  return isLocale(saved) ? saved : "en";
}
