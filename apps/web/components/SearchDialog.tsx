"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { caption, glossary, lessonHref, lessons } from "@tbt/content";

interface Entry { title: string; sub: string; href: string; text: string }

function buildIndex(): Entry[] {
  const out: Entry[] = [];
  for (const l of lessons) {
    out.push({ title: `${l.number} ${l.title}`, sub: l.summary, href: lessonHref(l), text: `${l.title} ${l.summary} ${l.takeaways.join(" ")}`.toLowerCase() });
    for (const s of l.steps) out.push({ title: s.title, sub: `${l.number} ${l.title}`, href: lessonHref(l, s.id), text: `${s.title} ${caption(s.captionKey)}`.toLowerCase() });
  }
  for (const g of glossary) {
    const l = lessons.find((x) => x.id === g.lesson);
    out.push({ title: g.term, sub: g.definition, href: l ? lessonHref(l) : "/glossary", text: `${g.term} ${g.definition}`.toLowerCase() });
  }
  return out;
}

/** Ctrl/⌘+K search over lesson titles, captions and the glossary. Index is built in the browser on first open. */
export function SearchDialog() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [index, setIndex] = useState<Entry[] | null>(null);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setOpen((o) => !o); }
      else if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  useEffect(() => {
    if (open) { setIndex((i) => i ?? buildIndex()); setTimeout(() => input.current?.focus(), 0); }
  }, [open]);

  const results = useMemo(() => {
    const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length || !index) return [];
    return index
      .map((e) => ({ e, score: terms.reduce((s, t) => s + (e.text.includes(t) ? (e.title.toLowerCase().includes(t) ? 3 : 1) : -100), 0) }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);
  }, [q, index]);

  return (
    <>
      <button type="button" className="btn btn-ghost" onClick={() => setOpen(true)} aria-label="Search (Ctrl K)">
        <span aria-hidden="true">⌕</span> <span className="kbd">⌘K</span>
      </button>
      {open && (
        <div className="search-backdrop" onClick={() => setOpen(false)}>
          <div className="search-box" role="dialog" aria-modal="true" aria-label="Search" onClick={(e) => e.stopPropagation()}>
            <input ref={input} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search lessons and terms…" aria-label="Search lessons and terms" />
            <ul>
              {q && results.length === 0 && <li style={{ padding: 10 }}>No results</li>}
              {results.map(({ e }) => (
                <li key={e.href + e.title}>
                  <Link href={e.href} onClick={() => setOpen(false)}>
                    {e.title}
                    <small>{e.sub}</small>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
