import cards from "./cards.json";
import content from "./card-content.json";

type Card = (typeof cards)[number];
export type CardArticle = {
 keywords:string[];
 image:string;
 general:string;
 love:string;
 work:string;
 money:string;
 reflection:string;
};

export function detailFor(card:Card):CardArticle {
 const article=(content as Record<string,CardArticle>)[card.name];
 if(!article)throw new Error(`Missing article for ${card.name}`);
 return article;
}
