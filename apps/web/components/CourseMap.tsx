"use client";
import Link from "next/link";
import type { ModuleMeta } from "@tbt/content";
import { getLessonById, lessonHref } from "@tbt/content";
import { useProgress } from "@tbt/engine";

export function CourseMap({ modules }: { modules: (ModuleMeta & { lessonIds: string[] })[] }) {
  const progress = useProgress();
  return (
    <div className="path">
      {modules.map((m) => {
        const doneCount = m.lessonIds.filter((id) => progress[id]?.completedAt).length;
        return (
          <section key={m.id} className="module" data-live={m.live} style={{ ["--accent" as string]: m.accent }}>
            <h2>Module {m.number}: {m.title} {m.live ? <span className="pill">{doneCount}/{m.lessonIds.length} done</span> : <span className="pill">coming soon</span>}</h2>
            <p className="blurb">{m.blurb}</p>
            {m.live && (
              <div className="cards">
                {m.lessonIds.map((id) => {
                  const l = getLessonById(id)!;
                  const done = Boolean(progress[id]?.completedAt);
                  return (
                    <Link key={id} href={lessonHref(l)} className="card">
                      <span className={`pill${done ? " done" : ""}`}>{done ? "✓ done" : `${l.number} · ${l.minutes} min`}</span>
                      <h3>{l.title}</h3>
                      <p>{l.summary}</p>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
