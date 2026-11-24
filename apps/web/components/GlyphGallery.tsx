"use client";
import { Glyph, glyphSize, GLYPH_KINDS, type GlyphState } from "@tbt/glyphs";

const STATES: GlyphState[] = ["idle", "active", "done", "error", "ghost"];
const SAMPLE: Record<string, Record<string, unknown>> = {
  token: { label: "believ", id: 15532 },
  tokenStrip: { tokens: ["The", " capital", " of"] },
  vector: { angle: 40, len: 70, label: "v" },
  model: { label: "Model" },
  layer: { label: "Attention" },
  db: { label: "index" },
  tool: { label: "search" },
  agent: { label: "Agent" },
  user: { label: "You" },
  bars: { items: [{ label: " Paris", value: 0.71, picked: true }, { label: " the", value: 0.08 }] },
  grid: { cells: [[0.1, 0.9, 0.3], [0.7, 0.2, 0.8], [0.4, 0.6, 0.1]] },
  callout: { text: "Callout text" },
  text: { label: "Plain text", size: 18 },
  box: { label: "container" },
  dot: { label: "dot" },
  meter: { value: 0.6 },
};

function Cell({ kind, state }: { kind: string; state: GlyphState }) {
  const props = SAMPLE[kind] ?? {};
  const d = glyphSize(kind, props);
  const w = kind === "vector" ? 120 : d.w;
  const h = kind === "vector" ? 100 : d.h;
  const pad = 24;
  return (
    <div className="gallery-cell" data-testid={`glyph-${kind}-${state}`}>
      <h4>{kind} · {state}</h4>
      <svg viewBox={`${-pad} ${-pad} ${w + pad * 2 + (kind === "vector" ? 20 : 0)} ${h + pad * 2 + 10}`} width="100%" height={Math.min(150, h + pad * 2)} role="img" aria-label={`${kind} glyph, ${state}`}>
        <g transform={kind === "vector" ? `translate(10 ${h - 10})` : undefined}>
          <Glyph kind={kind} props={props} w={w} h={h} state={state} reduced />
        </g>
      </svg>
    </div>
  );
}

export function GlyphGallery() {
  return (
    <>
      {(["light", "dark"] as const).map((theme) => (
        <section key={theme} data-theme={theme} style={{ background: "var(--tbt-paper)", color: "var(--tbt-ink)", padding: 16, borderRadius: 12, marginBlock: 16 }}>
          <h2 style={{ marginTop: 0 }}>{theme} theme</h2>
          <div className="gallery">
            {GLYPH_KINDS.flatMap((k) => STATES.map((s) => <Cell key={`${k}-${s}`} kind={k} state={s} />))}
          </div>
        </section>
      ))}
    </>
  );
}
