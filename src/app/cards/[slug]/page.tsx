import TarotExplorer from "@/features/tarot/components/tarot-explorer";
import cards from "@/features/tarot/data/cards.json";
import { notFound } from "next/navigation";
import { publishedArticles } from "@/features/cms/lib/content";
import { galleryLocale } from "@/features/tarot/lib/server-language";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const slugFor=(name:string)=>name.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");

export function generateStaticParams(){return cards.map(card=>({slug:slugFor(card.name)}))}

export default async function CardPage({params,searchParams}:{params:Promise<{slug:string}>;searchParams:Promise<{lang?:string}>}){
 const {slug}=await params;
 const card=cards.find(item=>slugFor(item.name)===slug);
 if(!card)notFound();
 const {lang}=await searchParams;
 return <TarotExplorer initialCardId={card.id} translations={await publishedArticles()} initialLocale={await galleryLocale(lang)}/>;
}
