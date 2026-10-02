"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Save, Eye, Send, LogOut, ExternalLink, X, PanelLeft, RotateCcw, Check, FileText, ImageIcon } from "lucide-react";
import cards from "@/features/tarot/data/cards.json";
import { cardName, galleryCopy, languageUrl, type Locale } from "@/features/tarot/lib/language";
import { documentSchema, managedCardSchema, errorSchema, readingFields, type ContentDocument, type ManagedCard } from "../lib/schema";
import styles from "./studio.module.css";

const slugFor = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const storageKey = (id: string, locale: Locale) => `tarotler-draft:${id}:${locale}`;
const changed = (entry: ManagedCard) => JSON.stringify(entry.document) !== JSON.stringify(entry.published);

export default function ContentStudio({ initialDocuments }: { initialDocuments: ManagedCard[] }) {
  const router = useRouter();
  const [documents, setDocuments] = useState(initialDocuments);
  const [locale, setLocale] = useState<Locale>("en");
  const [selectedId, setSelectedId] = useState(cards[0].id);
  const first = initialDocuments.find(entry => entry.id === cards[0].id && entry.locale === "en")!;
  const [working, setWorking] = useState<ContentDocument>(first.document);
  const [keywords, setKeywords] = useState(first.document.article.keywords.join(", "));
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("All cards");
  const [status, setStatus] = useState("All statuses");
  const [tab, setTab] = useState<"reading" | "sources" | "preview">("reading");
  const [busy, setBusy] = useState<"save" | "publish" | "reload" | "logout" | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [conflict, setConflict] = useState(false);
  const [showList, setShowList] = useState(false);
  const [recovery, setRecovery] = useState<ContentDocument | null>(null);
  const scrollArea = useRef<HTMLDivElement>(null);
  const selected = documents.find(entry => entry.id === selectedId && entry.locale === locale)!;
  const card = cards.find(entry => entry.id === selectedId)!;
  const dirty = JSON.stringify(working) !== JSON.stringify(selected.document);
  const draftCount = documents.filter(entry => entry.locale === locale && changed(entry) && (entry.published || entry.version > 0)).length;
  const unpublishedCount = documents.filter(entry => entry.locale === locale && !entry.published).length;
  const labels = galleryCopy[locale];
  const filtered = cards.filter(card => {
    const entry = documents.find(entry => entry.id === card.id && entry.locale === locale)!;
    return (group === "All cards" || group === card.group) && card.name.toLowerCase().includes(query.toLowerCase())
      && (status === "All statuses" || (status === "Not published" ? !entry.published : status === "Draft changes" ? changed(entry) && (!!entry.published || entry.version > 0) : !changed(entry)));
  });

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (dirty) event.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try {
        const raw = localStorage.getItem(storageKey(selectedId, locale)) ?? (locale === "en" ? localStorage.getItem(`tarottler-draft:${selectedId}`) : null);
        const result = raw ? documentSchema.safeParse(JSON.parse(raw)) : null;
        setRecovery(result?.success && JSON.stringify(result.data) !== JSON.stringify(selected.document) ? result.data : null);
      } catch { setRecovery(null); }
    });
    return () => cancelAnimationFrame(frame);
  }, [selectedId, locale, selected.document]);

  function update(next: ContentDocument) {
    setWorking(next); setMessage("");
    try { localStorage.setItem(storageKey(selectedId, locale), JSON.stringify(next)); } catch { /* The editor keeps changes even if local storage is unavailable. */ }
  }

  function select(id: string, language: Locale = locale) {
    if (id === selectedId && language === locale) { setShowList(false); return; }
    if (dirty && !window.confirm("Leave this card without saving? Your edits will remain available for recovery on this browser.")) return;
    const entry = documents.find(document => document.id === id && document.locale === language)!;
    setSelectedId(id); setLocale(language); setWorking(entry.document); setKeywords(entry.document.article.keywords.join(", "));
    setError(""); setMessage(""); setConflict(false); setRecovery(null); setShowList(false);
    scrollArea.current?.scrollTo({ top: 0 });
  }

  function accept(entry: ManagedCard) {
    setDocuments(current => current.map(document => document.id === entry.id && document.locale === entry.locale ? entry : document));
    setWorking(entry.document); setKeywords(entry.document.article.keywords.join(", "));
    try { localStorage.removeItem(storageKey(entry.id, entry.locale)); if(entry.locale === "en") localStorage.removeItem(`tarottler-draft:${entry.id}`); } catch { /* Recovery storage is optional. */ }
    setRecovery(null); setConflict(false);
  }

  async function mutate(action: "save" | "publish") {
    if (action === "publish" && !window.confirm(`Publish the ${locale.toUpperCase()} draft of ${card.name}? It will replace only this language's public reading.`)) return;
    setBusy(action); setError(""); setMessage("");
    try {
      const response = await fetch(`/api/admin/cards/${selectedId}?lang=${locale}`, {
        method: action === "save" ? "PUT" : "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(action === "save" ? { version: selected.version, document: working } : { version: selected.version }),
      });
      const result = await response.json();
      if (!response.ok) { setConflict(response.status === 409); throw new Error(errorSchema.parse(result).error); }
      accept(managedCardSchema.parse(result)); setMessage(action === "save" ? `${locale.toUpperCase()} draft saved.` : `${locale.toUpperCase()} published. The public reading is updated.`);
    } catch (error) { setError(error instanceof Error ? error.message : "Unable to save. Your edits are still here."); }
    finally { setBusy(null); }
  }

  async function reload() {
    if (dirty && !window.confirm("Reload the saved draft? Your current edits will be kept in browser recovery storage.")) return;
    setBusy("reload"); setError("");
    try {
      const response = await fetch(`/api/admin/cards/${selectedId}?lang=${locale}`, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(errorSchema.parse(payload).error);
      const result = managedCardSchema.parse(payload);
      // Keep the browser copy available instead of discarding edits after a conflict.
      setDocuments(current => current.map(document => document.id === result.id && document.locale === result.locale ? result : document));
      setWorking(result.document); setKeywords(result.document.article.keywords.join(", ")); setConflict(false); setMessage("Saved version loaded.");
    } catch (error) { setError(error instanceof Error ? error.message : "Unable to reload."); }
    finally { setBusy(null); }
  }

  async function logout() {
    if (dirty && !window.confirm("Sign out without saving? Your edits will remain in this browser.")) return;
    setBusy("logout");
    try {
      const response = await fetch("/api/admin/session", { method: "DELETE" });
      if (!response.ok) throw new Error("Unable to sign out.");
      router.replace("/admin/login"); router.refresh();
    } catch (error) { setError(error instanceof Error ? error.message : "Unable to sign out."); setBusy(null); }
  }

  return <main className={styles.studio} lang="en">
    <header className={styles.header}>
      <div className={styles.headerBrand}><Link href="/" className={styles.brand}>Tarotler</Link><span>Content studio</span></div>
      <div className={styles.headerActions}><Link href="/" target="_blank" className={styles.textButton}>View website<ExternalLink size={14} /></Link><button onClick={logout} disabled={!!busy} title="Sign out" aria-label="Sign out"><LogOut size={18} /></button></div>
    </header>
    <aside className={`${styles.sidebar} ${showList ? styles.sidebarOpen : ""}`}>
      <div className={styles.sidebarHeading}><h1>Card library</h1><button className={styles.mobileOnly} onClick={() => setShowList(false)} aria-label="Close card list"><X size={18} /></button></div>
      <p className={styles.libraryStats}>78 cards · {locale.toUpperCase()}<span>{unpublishedCount ? `${unpublishedCount} unpublished` : `${draftCount} with draft changes`}</span></p>
      <div className={styles.search}><Search size={16} /><input aria-label="Search card library" placeholder="Search cards" value={query} onChange={event => setQuery(event.target.value)} /></div>
      <div className={styles.filters}><select aria-label="Filter by suit" value={group} onChange={event => setGroup(event.target.value)}>{["All cards", "Major Arcana", "Wands", "Cups", "Swords", "Pentacles"].map(group => <option key={group}>{group}</option>)}</select><select aria-label="Filter by status" value={status} onChange={event => setStatus(event.target.value)}>{["All statuses", "Draft changes", "Published", "Not published"].map(status => <option key={status}>{status}</option>)}</select></div>
      <div className={styles.cardList} aria-label="Cards">
        {filtered.map(card => {
          const entry = documents.find(document => document.id === card.id && document.locale === locale)!;
          return <button key={card.id} disabled={!!busy} onClick={() => select(card.id)} aria-current={selectedId === card.id ? "true" : undefined} className={`${styles.cardRow} ${selectedId === card.id ? styles.selected : ""}`}>
            <Image src={card.small} alt="" width={28} height={47} /><span><strong>{card.name}</strong><small>{card.group}</small></span><span title={!entry.published ? "Not published" : changed(entry) ? "Draft changes" : "Published"} className={`${styles.statusDot} ${changed(entry) ? styles.draftDot : ""}`} /><span className="sr-only">{!entry.published ? "Not published" : changed(entry) ? "Draft changes" : "Published"}</span>
          </button>;
        })}
        {!filtered.length && <div className={styles.noResults}>No cards found.<button onClick={() => { setQuery(""); setGroup("All cards"); setStatus("All statuses"); }}>Clear filters</button></div>}
      </div>
      <div className={styles.listFooter}>{filtered.length} of 78 cards</div>
    </aside>
    <section className={styles.editor} aria-label="Card editor">
      <div className={styles.editorHeading}>
        <div><button className={`${styles.mobileOnly} ${styles.libraryToggle}`} onClick={() => setShowList(true)}><PanelLeft size={16} />Card library</button><p className={styles.eyebrow}>{card.group}</p><h2>{card.name}</h2><div className={styles.stateLine}><span className={dirty ? styles.unsaved : changed(selected) ? styles.draftBadge : styles.publishedBadge}>{dirty ? "Unsaved changes" : !selected.published ? "Not published" : changed(selected) ? "Draft changes" : "Published"}</span><span>{locale.toUpperCase()} · Revision {selected.version}</span></div></div>
        <div className={styles.editorActions}><button disabled={!!busy} title="Reload saved draft" aria-label="Reload saved draft" onClick={reload}><RotateCcw size={16} /></button><button className={styles.secondary} disabled={!!busy || !dirty} onClick={() => mutate("save")}><Save size={16} />{busy === "save" ? "Saving..." : "Save draft"}</button><button className={styles.primary} disabled={!!busy || dirty || !changed(selected)} onClick={() => mutate("publish")}><Send size={15} />{busy === "publish" ? "Publishing..." : "Publish"}</button></div>
      </div>
      <div className={styles.contentLanguage}><span>Content language</span><div role="radiogroup" aria-label="Content language">{(["en","vi"] as const).map(language => <button key={language} type="button" role="radio" aria-checked={locale === language} disabled={!!busy} onClick={() => select(selectedId, language)}>{language === "en" ? "EN · English" : "VI · Tiếng Việt"}</button>)}</div></div>
      <div className={styles.tabs} role="tablist" aria-label="Editor views">
        {([{ id: "reading", label: "Reading", icon: FileText }, { id: "sources", label: "Sources & notes", icon: ImageIcon }, { id: "preview", label: "Preview", icon: Eye }] as const).map(item => <button key={item.id} id={`tab-${item.id}`} role="tab" aria-selected={tab === item.id} aria-controls={`panel-${item.id}`} tabIndex={tab === item.id ? 0 : -1} onKeyDown={event => { if (event.key === "ArrowLeft" || event.key === "ArrowRight") { const modes = ["reading", "sources", "preview"] as const; const next = modes[(modes.indexOf(tab) + (event.key === "ArrowRight" ? 1 : 2)) % 3]; setTab(next); document.getElementById(`tab-${next}`)?.focus(); } }} onClick={() => setTab(item.id)}><item.icon size={16} />{item.label}</button>)}
      </div>
      <div className={styles.feedback} aria-live="polite">{error ? <div className={styles.error} role="alert">{error}{conflict && <button onClick={reload} disabled={!!busy}>Reload saved version</button>}</div> : message ? <span className={styles.success}><Check size={14} />{message}</span> : null}</div>
      {recovery && <div className={styles.recovery}>Browser edits are available for this {locale.toUpperCase()} draft.<div><button disabled={!!busy} onClick={() => { update(recovery); setKeywords(recovery.article.keywords.join(", ")); setRecovery(null); }}>Restore</button><button disabled={!!busy} onClick={() => { localStorage.removeItem(storageKey(selectedId,locale)); if(locale === "en") localStorage.removeItem(`tarottler-draft:${selectedId}`); setRecovery(null); }}>Dismiss</button></div></div>}
      <div ref={scrollArea} className={styles.editorBody}>
        <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
          {tab === "reading" && <div className={styles.readingLayout}>
            <div className={styles.fields}>
              <div className={styles.field}><label htmlFor="display-name">Card name · {locale.toUpperCase()}</label><input lang={locale} id="display-name" disabled={!!busy} value={working.editorial.displayName ?? cardName(card,locale)} maxLength={120} onChange={event => update({...working, editorial: {...working.editorial, displayName: event.target.value}})} /></div>
              <div className={styles.field}><label htmlFor="keywords">Keywords<span>{working.article.keywords.length} / 6</span></label><input id="keywords" disabled={!!busy} value={keywords} maxLength={500} onChange={event => { setKeywords(event.target.value); update({ ...working, article: { ...working.article, keywords: event.target.value.split(",").map(word => word.trim()).filter(Boolean) } }); }} /></div>
              {readingFields.map(field => <div className={styles.field} key={field}><label htmlFor={field}>{labels[field]}</label><textarea lang={locale} id={field} disabled={!!busy} rows={field === "reflection" ? 3 : 5} maxLength={12000} value={working.article[field]} onChange={event => update({ ...working, article: { ...working.article, [field]: event.target.value } })} /></div>)}
            </div>
            <aside className={styles.artwork}><Image src={card.small} alt={working.editorial.altText || card.name} width={240} height={400} /><div><span>Rider-Waite-Smith · Pam-A</span><a href={card.source} target="_blank" rel="noreferrer">Original scan<ExternalLink size={12} /></a><Link href={languageUrl(`/cards/${slugFor(card.name)}`,locale)} target="_blank">Published reading · {locale.toUpperCase()}<ExternalLink size={12} /></Link></div></aside>
          </div>}
          {tab === "sources" && <div className={styles.sourceFields}>
            <div className={styles.field}><label htmlFor="alt-text">Image alt text</label><textarea id="alt-text" disabled={!!busy} rows={3} maxLength={500} value={working.editorial.altText} onChange={event => update({ ...working, editorial: { ...working.editorial, altText: event.target.value } })} /></div>
            <div className={styles.field}><label htmlFor="references">Reference sources</label><textarea id="references" disabled={!!busy} rows={5} maxLength={5000} value={working.editorial.references} onChange={event => update({ ...working, editorial: { ...working.editorial, references: event.target.value } })} /></div>
            <div className={styles.sourceSelectors}><div className={styles.field}><label htmlFor="origin">Content origin</label><select id="origin" disabled={!!busy} value={working.editorial.origin} onChange={event => update({ ...working, editorial: { ...working.editorial, origin: event.target.value as ContentDocument["editorial"]["origin"] } })}><option value="unspecified">Unspecified</option><option value="ai-generated">AI-generated</option><option value="human">Human-written</option></select></div><div className={styles.field}><label htmlFor="review">Editorial review</label><select id="review" disabled={!!busy} value={working.editorial.reviewStatus} onChange={event => update({ ...working, editorial: { ...working.editorial, reviewStatus: event.target.value as ContentDocument["editorial"]["reviewStatus"] } })}><option value="unreviewed">Not reviewed</option><option value="reviewed">Reviewed</option></select></div></div>
            <div className={styles.field}><label htmlFor="notes">Private notes</label><textarea id="notes" disabled={!!busy} rows={7} maxLength={12000} value={working.editorial.notes} onChange={event => update({ ...working, editorial: { ...working.editorial, notes: event.target.value } })} /></div>
          </div>}
          {tab === "preview" && <article lang={locale} className={styles.preview}><div className={styles.previewArt}><Image src={card.small} alt={working.editorial.altText || card.name} width={240} height={400} /></div><div><span className={styles.previewLabel}>Draft preview · {locale.toUpperCase()}</span><h2>{working.editorial.displayName || cardName(card,locale)}</h2><p className={styles.previewKeywords}>{working.article.keywords.join(" · ")}</p>{readingFields.map(field => <section key={field}><h3>{labels[field]}</h3><p>{working.article[field] || "—"}</p></section>)}</div></article>}
        </div>
      </div>
      <footer className={styles.editorFooter}><span>{selected.publishedAt ? `Published ${new Date(selected.publishedAt).toLocaleString("en-GB", { timeZone: "Asia/Ho_Chi_Minh" })}` : selected.published ? "Original reading" : "No published translation"}</span><span>Private notes stay in the studio</span></footer>
    </section>
  </main>;
}
