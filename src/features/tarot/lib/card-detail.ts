import cards from "../data/cards.json";
import content from "../data/card-content.json";
import type { Locale } from "./language";

type Card = (typeof cards)[number];
export type CardArticle = {
 keywords:string[];
 image:string;
 general:string;
 love:string;
 work:string;
 money:string;
 reflection:string;
 altText?:string;
 title?:string;
 contentLanguage?:Locale;
};
export type PublishedArticles = Record<Locale,Record<string,CardArticle>>;

export function detailFor(card:Card, articles:Record<string,CardArticle>=content):CardArticle {
 const article=articles[card.name];
 if(!article)throw new Error(`Missing article for ${card.name}`);
 return article;
}
