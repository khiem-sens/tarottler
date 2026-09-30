"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { Observer } from "gsap/Observer";
import { useGSAP } from "@gsap/react";
import { Search, X, Info } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty } from "@/components/ui/empty";
import cards from "./cards.json";
import { detailFor } from "./card-detail";
import { metadataFor } from "./card-metadata";
gsap.registerPlugin(Observer, useGSAP);
const groups = ["All cards", "Major Arcana", "Wands", "Cups", "Swords", "Pentacles"];
const mod = (v:number,n:number) => ((v%n)+n)%n;
const slugFor=(name:string)=>name.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
const cardFromPath=()=>cards.find(card=>`/cards/${slugFor(card.name)}`===window.location.pathname);
export default function Home({initialCardId}:{initialCardId?:string}={}){
 const [query,setQuery]=useState(""); const [group,setGroup]=useState("All cards"); const [filterHoverIndex,setFilterHoverIndex]=useState<number|null>(null); const [searchOpen,setSearchOpen]=useState(false); const [info,setInfo]=useState(false); const [ready,setReady]=useState(false); const [announcement,setAnnouncement]=useState("");
 const [detailId,setDetailId]=useState<string|null>(initialCardId??null),[detailOpen,setDetailOpen]=useState(!!initialCardId);
 const closeTimer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined),scrollFadeTimer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined),detailDepth=useRef(0),returnFocus=useRef<HTMLElement|null>(null),focusWasKeyboard=useRef(false),closeButton=useRef<HTMLButtonElement>(null),detailPanel=useRef<HTMLElement>(null),detailScroll=useRef<HTMLDivElement>(null),detailCopy=useRef<HTMLDivElement>(null),scrollIndicator=useRef<HTMLSpanElement>(null);
 const openDetailRef=useRef<(id:string)=>void>(()=>{});
 const input=useRef<HTMLInputElement>(null), searchButton=useRef<HTMLButtonElement>(null), gallery=useRef<HTMLElement>(null), homeRef=useRef<HTMLElement>(null), cursor=useRef<HTMLSpanElement>(null);
 const moveCursor=useRef<(x:number,y:number)=>void>(()=>{});
 const engine=useRef<{move:(n:number)=>void;select:(n:number)=>void}>({move:()=>{},select:()=>{}});
 const suppressed=useRef(false);
 const detailCard=cards.find(card=>card.id===detailId);
 const article=detailCard?detailFor(detailCard):null;
 const metadata=detailCard?metadataFor(detailCard):null;
 const detailIndex=detailCard?cards.findIndex(card=>card.id===detailCard.id):-1;
 const showDetail=(id:string)=>{clearTimeout(closeTimer.current);focusWasKeyboard.current=document.documentElement.dataset.inputMethod==="keyboard";returnFocus.current=document.activeElement as HTMLElement;detailDepth.current=1;setDetailId(id);setDetailOpen(true);history.pushState({card:id,tarotDepth:1},"",`/cards/${slugFor(cards.find(c=>c.id===id)!.name)}`)};
 openDetailRef.current=showDetail;
 const hideDetail=()=>{clearTimeout(scrollFadeTimer.current);scrollIndicator.current?.classList.remove("is-scrolling");setDetailOpen(false);closeTimer.current=setTimeout(()=>setDetailId(null),560)};
 const closeDetail=()=>{if(detailDepth.current>0)history.go(-detailDepth.current);else{history.replaceState({},"","/");hideDetail()}};
 const moveDetail=(offset:number)=>{if(detailIndex<0)return;const card=cards[mod(detailIndex+offset,cards.length)];detailDepth.current=detailDepth.current>0?detailDepth.current+1:0;history.pushState({card:card.id,tarotDepth:detailDepth.current},"",`/cards/${slugFor(card.name)}`);setDetailId(card.id);detailCopy.current?.scrollTo({top:0});detailScroll.current?.scrollTo({top:0});scrollIndicator.current?.classList.remove("is-scrolling")};
 useEffect(()=>{const pop=(event:PopStateEvent)=>{const card=cardFromPath();detailDepth.current=typeof event.state?.tarotDepth==="number"?event.state.tarotDepth:0;if(card){clearTimeout(closeTimer.current);setDetailId(card.id);setDetailOpen(true);detailCopy.current?.scrollTo({top:0});detailScroll.current?.scrollTo({top:0})}else hideDetail()};window.addEventListener("popstate",pop);return()=>{window.removeEventListener("popstate",pop);clearTimeout(closeTimer.current);clearTimeout(scrollFadeTimer.current)}},[]);
 const updateScrollIndicator=(event:React.UIEvent<HTMLDivElement>)=>{
  if(event.target!==event.currentTarget||!detailPanel.current||!scrollIndicator.current)return;
  const area=event.currentTarget,remaining=area.scrollHeight-area.clientHeight;
  if(remaining<2)return;
  const panel=detailPanel.current.getBoundingClientRect(),rect=area.getBoundingClientRect();
  const thumb=Math.min(area.clientHeight,Math.max(28,area.clientHeight*area.clientHeight/area.scrollHeight));
  const top=rect.top-panel.top+(area.scrollTop/remaining)*(area.clientHeight-thumb);
  const bar=scrollIndicator.current;
  bar.style.top=`${top}px`;bar.style.left=`${rect.right-panel.left-2}px`;bar.style.height=`${thumb}px`;
  bar.classList.add("is-scrolling");
  clearTimeout(scrollFadeTimer.current);
  scrollFadeTimer.current=setTimeout(()=>bar.classList.remove("is-scrolling"),850);
 };
 useEffect(()=>{if(!detailOpen)return;const previous=document.body.style.overflow;document.body.style.overflow="hidden";const frame=focusWasKeyboard.current?requestAnimationFrame(()=>closeButton.current?.focus()):0;const key=(e:KeyboardEvent)=>{if(e.key==="Escape"){e.preventDefault();closeDetail()}if(e.key==="Tab"&&detailPanel.current){const items=Array.from(detailPanel.current.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],[tabindex="0"]'));if(!items.length)return;const first=items[0],last=items[items.length-1];if(!detailPanel.current.contains(document.activeElement)){e.preventDefault();first.focus()}else if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}};document.addEventListener("keydown",key);return()=>{if(frame)cancelAnimationFrame(frame);document.body.style.overflow=previous;document.removeEventListener("keydown",key);if(focusWasKeyboard.current)returnFocus.current?.focus()}},[detailOpen]);
 const filtered=useMemo(()=>cards.filter(c=> (group==="All cards"||c.group===group) && query.trim().toLowerCase().split(/\s+/).every(q=> /^\d+$/.test(q)?c.rank===Number(q):`${c.name} ${c.alias} ${c.group}`.toLowerCase().includes(q))),[query,group]);
 const setCursorMode=(area:HTMLElement,discover:boolean)=>{
  if(area.classList.contains("on-discover")===discover)return;
  area.classList.toggle("on-discover",discover);
 };
 useEffect(()=>{if(searchOpen)input.current?.focus()},[searchOpen]);
 useEffect(()=>{
  const el=cursor.current;if(!el)return;
  const moveX=gsap.quickTo(el,"x",{duration:.18,ease:"power3.out"});
  const moveY=gsap.quickTo(el,"y",{duration:.18,ease:"power3.out"});
  moveCursor.current=(x,y)=>{moveX(x);moveY(y)};
  return()=>{gsap.killTweensOf(el);moveCursor.current=()=>{}};
 },[]);
 useEffect(()=>{
  const pointer=()=>{document.documentElement.dataset.inputMethod="pointer"};
  const keyboard=(event:KeyboardEvent)=>{if(["Tab","ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Enter"," "].includes(event.key))document.documentElement.dataset.inputMethod="keyboard"};
  document.addEventListener("pointerdown",pointer,true);document.addEventListener("keydown",keyboard,true);
  return()=>{document.removeEventListener("pointerdown",pointer,true);document.removeEventListener("keydown",keyboard,true);delete document.documentElement.dataset.inputMethod};
 },[]);
 useGSAP(()=>{
  const area=gallery.current; if(!area||!filtered.length)return;
  const pool=Array.from(area.querySelectorAll<HTMLButtonElement>(".card")); const initialIndex=initialCardId?filtered.findIndex(card=>card.id===initialCardId):-1; const pos={value:Math.max(0,initialIndex)}; let target=pos.value; let timer:ReturnType<typeof setTimeout>|undefined; let clickTimer:ReturnType<typeof setTimeout>|undefined;
  let reduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const motionQuery=window.matchMedia("(prefers-reduced-motion: reduce)"); const onMotion=()=>{reduced=motionQuery.matches};motionQuery.addEventListener("change",onMotion);
  const announce=()=>setAnnouncement(`${filtered[mod(Math.round(pos.value),filtered.length)].name}. ${mod(Math.round(pos.value),filtered.length)+1} of ${filtered.length} cards.`);
  const render=()=>{
   const w=area.clientWidth,h=area.clientHeight; const cardH=Math.max(90,Math.min(h*.83,620,w<600?w*1.17:680)); const cardW=cardH*.59; const spacing=cardW*(w<600?1.08:1.13); const base=Math.round(pos.value);
   pool.forEach((el,i)=>{
    if(filtered.length===1 && i!==0){el.style.display="none";return;}
    const virtual=filtered.length===1?0:base-4+mod(i-(base-4),9); const delta=virtual-pos.value,abs=Math.abs(delta);const card=filtered[mod(virtual,filtered.length)];
    el.style.display=abs>3.7?"none":"block";
    el.style.width=`${cardW}px`;el.style.height=`${cardH}px`;el.style.zIndex=String(10-Math.round(abs));
    const scale=reduced?1:Math.max(.65,1-abs*.15);
    el.style.transform=`translate(-50%,-50%) translate3d(${delta*spacing}px,0,0) scale(${scale})`;
    el.style.opacity=String(reduced?1:Math.max(.13,1-abs*.25));
    el.classList.toggle("is-active",abs<.02);
    el.dataset.virtual=String(virtual);el.setAttribute("aria-label",card.name);el.tabIndex=abs<.5?0:-1;el.setAttribute("aria-hidden",abs>1.6?"true":"false");
    const nearViewport=Math.abs(delta*spacing)<w/2+cardW*scale/2+24;
    if(nearViewport && el.dataset.card!==card.id){
     el.dataset.card=card.id;el.querySelector(".card-title")!.textContent=card.name;el.classList.remove("image-error");el.classList.add("is-loading");const img=el.querySelector("img")!;img.alt=card.name;img.loading=abs<.5?"eager":"lazy";img.srcset=`${card.small} 600w, ${card.src.replace(".webp","-800.webp")} 800w, ${card.src} ${card.width}w`;img.sizes=`${Math.ceil(cardW*scale)}px`;img.src=card.src;img.setAttribute("fetchpriority",abs<.5?"high":"low");el.querySelector(".image-fallback")!.textContent=`${card.name} — image unavailable`;
    }
   });
   setCursorMode(area,!area.classList.contains("dragging")&&!!area.querySelector(".card.is-active:not(.is-loading):not(.image-error):hover"));
  };
  const stop=()=>{clearTimeout(timer);gsap.killTweensOf(pos)};
  const snap=(v:number)=>{if(filtered.length<2)return;stop();target=Math.round(v);gsap.to(pos,{value:target,duration:reduced?.08:.55,ease:"power3.out",onUpdate:render,onComplete:announce})};
  const move=(n:number)=>snap(Math.round(pos.value)+n);
  engine.current={move,select:snap};
  render();announce();
  const observer=Observer.create({target:area,type:"wheel,touch,pointer",preventDefault:true,allowClicks:true,ignore:".arrow",dragMinimum:7,tolerance:0,lockAxis:true,
   onPress:()=>{stop();target=pos.value;suppressed.current=false;},
   onDragStart:()=>{suppressed.current=true;area.classList.add("dragging");setCursorMode(area,false)},
   onDrag:self=>{if(filtered.length<2)return;const unit=Math.max(130,Math.min(area.clientHeight*.83,620)*.59*1.13);pos.value-=self.deltaX/unit;target=pos.value;render()},
   onRelease:self=>{area.classList.remove("dragging");if(suppressed.current){snap(pos.value-gsap.utils.clamp(-1.3,1.3,self.velocityX/1900));clickTimer=setTimeout(()=>{suppressed.current=false},150)}},
   onWheel:self=>{if(filtered.length<2)return;clearTimeout(timer);const d=Math.abs(self.deltaX)>Math.abs(self.deltaY)?self.deltaX:self.deltaY;target+=gsap.utils.clamp(-.65,.65,d/430);gsap.to(pos,{value:target,duration:reduced?.05:.22,overwrite:true,ease:"power2.out",onUpdate:render});timer=setTimeout(()=>snap(target),140)}
  });
  const resize=new ResizeObserver(render);resize.observe(area);
  const keys=(e:KeyboardEvent)=>{const t=e.target as HTMLElement;if(document.querySelector(".card-drawer.is-open")||t.closest('input,[role="combobox"],[role="listbox"],[role="option"],header'))return;if(e.key==="ArrowLeft"||e.key==="ArrowRight"){e.preventDefault();move(e.key==="ArrowLeft"?-1:1)}};
  window.addEventListener("keydown",keys);
  return()=>{stop();clearTimeout(clickTimer);observer.kill();resize.disconnect();window.removeEventListener("keydown",keys);motionQuery.removeEventListener("change",onMotion);engine.current={move:()=>{},select:()=>{}};suppressed.current=false;};
 },{dependencies:[filtered],scope:gallery,revertOnUpdate:true});
 const trackDragCursor=(event:React.PointerEvent<HTMLElement>,immediate=false)=>{
  if(event.pointerType!=="mouse")return;
  const el=event.currentTarget,x=event.clientX,y=event.clientY;
  if((immediate||window.matchMedia("(prefers-reduced-motion: reduce)").matches)&&cursor.current)gsap.set(cursor.current,{x,y});else moveCursor.current(x,y);
  el.closest(".home")?.classList.add("has-pointer");
  el.classList.add("has-drag-pointer");
  setCursorMode(el,!el.classList.contains("dragging")&&!!(event.target as Element).closest(".card.is-active:not(.is-loading):not(.image-error)"));
 };
 const trackGlobalCursor=(event:React.PointerEvent<HTMLElement>)=>{
  if(event.pointerType!=="mouse")return;
  const home=event.currentTarget,target=event.target as Element;
  if(target.closest(".filter-menu")){home.classList.add("in-filter-menu");home.classList.remove("has-pointer");return}
  home.classList.remove("in-filter-menu");
  home.classList.add("has-pointer");
  const inGallery=!!target.closest(".gallery");
  home.classList.toggle("over-clickable",!inGallery&&!!target.closest('button,a,input,[role="combobox"]'));
  if(inGallery)return;
  if(window.matchMedia("(prefers-reduced-motion: reduce)").matches&&cursor.current)gsap.set(cursor.current,{x:event.clientX,y:event.clientY});
  else moveCursor.current(event.clientX,event.clientY);
 };
 const closeSearch=()=>{setSearchOpen(false);searchButton.current?.focus()};
 return <main ref={homeRef} className={`home ${ready?"is-ready":""} ${detailOpen?"has-detail":""}`} onPointerMove={trackGlobalCursor} onPointerLeave={e=>e.currentTarget.classList.remove("has-pointer","over-clickable")}><h1 className="sr-only">Tarottler — Rider–Waite–Smith tarot gallery</h1>
  <header><div className="brand-cluster"><a className="wordmark" href="/" aria-label="Tarottler home">Tarottler</a><button className="source-button" aria-label="About this deck" aria-expanded={info} onClick={()=>setInfo(!info)}><Info size={16}/></button></div><nav aria-label="Gallery controls">
   <div className={`search ${searchOpen?"is-open":""}`}>
    {searchOpen&&<div className="search-field"><label className="sr-only" htmlFor="card-search">Search cards by name or number</label><input id="card-search" name="card-search" autoComplete="off" type="search" ref={input} value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>{if(e.key==="Escape")closeSearch()}} placeholder="Find a card…" aria-label="Search cards by name or number"/>{query&&<button type="button" aria-label="Clear search" onClick={()=>{setQuery("");input.current?.focus()}}>Clear</button>}</div>}
    <button ref={searchButton} className={`icon-button ${query?"has-query":""}`} aria-label={searchOpen?"Close search":"Search cards"} aria-expanded={searchOpen} onClick={()=>searchOpen?closeSearch():setSearchOpen(true)}>{searchOpen?<X size={20}/>:<Search size={20}/>}</button>
   </div>
   <Select value={group} onValueChange={setGroup} onOpenChange={open=>{if(!open){setFilterHoverIndex(null);homeRef.current?.classList.remove("in-filter-menu")}}}><SelectTrigger aria-label="Filter cards" className="filter-trigger"><SelectValue/></SelectTrigger><SelectContent className="filter-menu" position="popper" align="end" onPointerEnter={()=>homeRef.current?.classList.add("in-filter-menu")} onPointerLeave={()=>homeRef.current?.classList.remove("in-filter-menu")}><div className="filter-options" style={{"--filter-index":filterHoverIndex??groups.indexOf(group)} as React.CSSProperties} onPointerLeave={()=>setFilterHoverIndex(null)}><span className="filter-dot" aria-hidden="true"/>{groups.map((g,i)=><SelectItem className="filter-item" key={g} value={g} onPointerMove={()=>setFilterHoverIndex(i)} onFocus={()=>setFilterHoverIndex(i)}>{g}</SelectItem>)}</div></SelectContent></Select>
  </nav></header>
  <section ref={gallery} className="gallery" aria-roledescription="carousel" aria-label="Rider–Waite–Smith tarot cards" onPointerEnter={e=>trackDragCursor(e,true)} onPointerMove={e=>trackDragCursor(e)} onPointerLeave={e=>e.currentTarget.classList.remove("has-drag-pointer","on-discover")}>
   {filtered.length>0? <><div className="card-stage">{Array.from({length:9},(_,i)=><button key={i} className="card" tabIndex={-1} onClick={e=>{if(suppressed.current)return;const el=e.currentTarget;if(el.classList.contains("is-active"))openDetailRef.current(el.dataset.card!);else engine.current.select(Number(el.dataset.virtual))}}><span className="card-title" aria-hidden="true"/><Skeleton className="card-loading" aria-hidden="true"><span className="loading-emblem">✦</span><span className="loading-message">Revealing the card</span></Skeleton><img draggable={false} decoding="async" alt="" onLoad={e=>{const card=e.currentTarget.parentElement;card?.classList.remove("is-loading");if(card?.classList.contains("is-active"))setReady(true)}} onError={e=>{const card=e.currentTarget.parentElement;card?.classList.remove("is-loading");card?.classList.add("image-error");if(card?.classList.contains("is-active"))setReady(true)}}/><span className="image-fallback"/></button>)}</div></>:<Empty className="empty"><p>No cards found.</p><span>Try another name or explore the full deck.</span><button onClick={()=>{setQuery("");setGroup("All cards")}}>Clear search & filter</button></Empty>}
  </section>
  <span ref={cursor} className="gallery-cursor" aria-hidden="true"><span className="gallery-cursor-inner"><span className="gallery-cursor-label drag-label">Drag</span><span className="gallery-cursor-label discover-label">View</span></span></span>
  {info&&<aside className="source-panel" onKeyDown={e=>{if(e.key==="Escape")setInfo(false)}}><button className="source-close" aria-label="Close deck information" onClick={()=>setInfo(false)}><X size={18}/></button><p>Rider–Waite–Smith</p><span>Artwork by Pamela Colman Smith, 1909.<br/>Pam-A scans from <a href="https://steve-p.org/cards/RWSa.html" target="_blank" rel="noreferrer">Steve P’s collection</a>.</span></aside>}
  {detailCard&&article&&<section ref={detailPanel} className={`card-drawer ${detailOpen?"is-open":""}`} role="dialog" aria-modal="true" aria-label={`${detailCard.name} card`} aria-hidden={!detailOpen} inert={!detailOpen}>
   <button ref={closeButton} className="drawer-close" onClick={closeDetail} aria-label="Close card view">Close</button>
   <div ref={detailScroll} className="drawer-scroll" key={detailCard.id} onScroll={updateScrollIndicator}><article className="drawer-article">
    <h2>{detailCard.name}</h2>
    <div className="drawer-hero"><div className="drawer-visual"><img src={detailCard.src} srcSet={`${detailCard.small} 600w, ${detailCard.src.replace(".webp","-800.webp")} 800w, ${detailCard.src} 1086w`} sizes="(max-width: 700px) 78vw, 340px" alt={`${detailCard.name}, Rider–Waite–Smith tarot card`} /></div></div>
    <div ref={detailCopy} className="drawer-copy" role="region" aria-label={`${detailCard.name} reading`} tabIndex={0} onScroll={updateScrollIndicator}>
     <dl className="drawer-metadata" aria-label="Card details">
      <div><dt>Card</dt><dd>{metadata?.number}</dd></div><div><dt>Arcana</dt><dd>{metadata?.arcana}</dd></div>
      {metadata?.element&&<div><dt>Element</dt><dd>{metadata.element}</dd></div>}
      {metadata?.zodiac&&<div><dt>Zodiac</dt><dd>{metadata.zodiac}</dd></div>}
      <div><dt>Yes / No</dt><dd>{metadata?.yesNo}</dd></div>
      <div className="drawer-keywords"><dt>Keyword</dt><dd>{article.keywords.join(", ")}</dd></div>
     </dl>
     <section className="drawer-section"><h3>In the image</h3><p>{article.image}</p></section>
     <section className="drawer-section"><h3>What it can suggest</h3><p>{article.general}</p></section>
     <section className="drawer-section"><h3>Love &amp; relationships</h3><p>{article.love}</p></section>
     <section className="drawer-section"><h3>Work &amp; study</h3><p>{article.work}</p></section>
     <section className="drawer-section"><h3>Money</h3><p>{article.money}</p></section>
     <section className="drawer-section drawer-reflection"><h3>For reflection</h3><p>{article.reflection}</p></section>
     <nav className="drawer-neighbors" aria-label="Browse cards">
      <button type="button" onClick={()=>moveDetail(-1)} aria-label={`Previous card: ${cards[mod(detailIndex-1,cards.length)].name}`}><span>← Previous card</span><strong>{cards[mod(detailIndex-1,cards.length)].name}</strong></button>
      <button type="button" onClick={()=>moveDetail(1)} aria-label={`Next card: ${cards[mod(detailIndex+1,cards.length)].name}`}><span>Next card →</span><strong>{cards[mod(detailIndex+1,cards.length)].name}</strong></button>
     </nav>
    </div>
   </article></div><span ref={scrollIndicator} className="drawer-scroll-indicator" aria-hidden="true"/>
  </section>}
  <div className="sr-only" aria-live="polite" aria-atomic="true">{filtered.length?announcement:"No cards found"}</div>
 </main>
}
