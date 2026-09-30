import Home from "../../page";
import cards from "../../cards.json";
import { notFound } from "next/navigation";

const slugFor=(name:string)=>name.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");

export function generateStaticParams(){return cards.map(card=>({slug:slugFor(card.name)}))}

export default async function CardPage({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params;
 const card=cards.find(item=>slugFor(item.name)===slug);
 if(!card)notFound();
 return <Home initialCardId={card.id}/>;
}
