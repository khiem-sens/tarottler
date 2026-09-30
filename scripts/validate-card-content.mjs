import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const cards=JSON.parse(readFileSync(new URL("../app/cards.json",import.meta.url)));
const articles=JSON.parse(readFileSync(new URL("../app/card-content.json",import.meta.url)));
const names=cards.map(card=>card.name);
const fields=["image","general","love","work","money","reflection"];
const issues=[];

if(cards.length!==78||new Set(names).size!==78)issues.push("The deck must contain 78 distinct cards.");
for(const card of cards){
 const article=articles[card.name];
 if(!article){issues.push(`Missing article: ${card.name}`);continue}
 if(!Array.isArray(article.keywords)||article.keywords.length<3||article.keywords.length>6||article.keywords.some(v=>!v.trim()))issues.push(`Invalid keywords: ${card.name}`);
 for(const field of fields)if(typeof article[field]!=="string"||article[field].trim().length<25)issues.push(`Invalid ${field}: ${card.name}`);
 if(!existsSync(join(process.cwd(),"public",card.src)))issues.push(`Missing image: ${card.name}`);
}
for(const name of Object.keys(articles))if(!names.includes(name))issues.push(`Unknown article: ${name}`);
if(issues.length){console.error(issues.join("\n"));process.exit(1)}
console.log(`Validated ${cards.length} card articles, image paths, keywords, and all reading sections.`);
