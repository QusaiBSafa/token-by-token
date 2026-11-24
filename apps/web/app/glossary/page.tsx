import type { Metadata } from "next";
import Link from "next/link";
import { glossary, getLessonById, lessonHref } from "@tbt/content";

export const metadata: Metadata = { title: "Glossary", description: "Plain-language definitions linked to the lesson that animates each term." };

export default function Glossary() {
  const sorted = [...glossary].sort((a, b) => a.term.localeCompare(b.term));
  return (
    <main className="wrap section">
      <p className="eyebrow">Glossary</p>
      <h1 style={{ margin: "0 0 8px", letterSpacing: "-0.02em" }}>Terms</h1>
      <dl className="glossary prose-narrow">
        {sorted.map((g) => {
          const l = getLessonById(g.lesson);
          return (
            <div key={g.id} id={g.id}>
              <dt>{g.term}</dt>
              <dd>{g.definition} {l && <Link href={lessonHref(l)}>See it in lesson {l.number} →</Link>}</dd>
            </div>
          );
        })}
      </dl>
    </main>
  );
}
