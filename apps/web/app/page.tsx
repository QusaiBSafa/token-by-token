import Link from "next/link";
import { lessons, lessonHref, modules } from "@tbt/content";
import { AutoplayDemo } from "@/components/AutoplayDemo";

export default function Home() {
  return (
    <main className="wrap">
      <section className="hero">
        <div>
          <p className="eyebrow">An animated AI engineering course</p>
          <h1>Learn how AI works by watching it move.</h1>
          <p className="lede">Follow one prompt through a language model, one token at a time. No setup, no jargon first.</p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link className="btn btn-primary" href={lessonHref(lessons[0]!)}>Start free →</Link>
            <Link className="btn" href="/learn">See the course map</Link>
          </div>
        </div>
        <AutoplayDemo />
      </section>

      <section className="section">
        <h2>Module 1: Foundations (free)</h2>
        <p className="sub">Four short lessons, about 20 minutes. Each one is a diagram you step through.</p>
        <div className="cards">
          {lessons.map((l) => (
            <Link key={l.id} href={lessonHref(l)} className="card">
              <span className="pill">{l.number} · {l.minutes} min</span>
              <h3>{l.title}</h3>
              <p>{l.summary}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="section">
        <h2>Where it goes next</h2>
        <p className="sub">From one prompt to a production AI system.</p>
        <div className="cards">
          {modules.filter((m) => !m.live).map((m) => (
            <div key={m.id} className="card" style={{ opacity: 0.7 }}>
              <span className="pill">Module {m.number} · coming soon</span>
              <h3>{m.title}</h3>
              <p>{m.blurb}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
