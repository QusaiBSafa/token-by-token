"use client";
import { useEffect, useRef, useState } from "react";
import { motion, useAnimationFrame } from "motion/react";
import type { Node, Scene } from "@tbt/content";
import { Glyph } from "@tbt/glyphs";
import { diffScenes, staggerDelays, type SceneDiff } from "./diff";
import { edgeLine, lerp, nodeBox } from "./geometry";
import { EASE, EDGE_DRAW_S, EXIT_MS, FADE, KNOB_MS, REDUCED_S, SLOW_FACTOR, SPRING, STAGGER_S } from "./motion";

export const CANVAS_W = 960;
export const CANVAS_H = 540;
const DIM = 0.35;

export interface SceneCanvasProps {
  scene: Scene;
  ariaLabel: string;
  /** zero-duration transition (deep link, replay reset) */
  instant?: boolean;
  /** short knob transition */
  fast?: boolean;
  /** slow motion (0.25x) for authoring */
  slow?: boolean;
  reduced?: boolean;
  /** draw a 20px coordinate grid with labels */
  debugGrid?: boolean;
  className?: string;
}

interface Render { scene: Scene; diff: SceneDiff }

export function SceneCanvas({ scene, ariaLabel, instant, fast, slow, reduced, debugGrid, className }: SceneCanvasProps) {
  const [st, setSt] = useState<Render>(() => ({ scene, diff: diffScenes(null, scene) }));
  if (st.scene !== scene) setSt({ scene, diff: diffScenes(st.scene, scene) });

  useEffect(() => {
    if (!st.diff.exit.length) return;
    const t = setTimeout(() => setSt((s) => (s.scene === st.scene ? { ...s, diff: { ...s.diff, exit: [] } } : s)), (EXIT_MS + 500) * (slow ? SLOW_FACTOR : 1));
    return () => clearTimeout(t);
  }, [st.scene, st.diff.exit.length, slow]);

  const { diff } = st;
  const k = slow ? SLOW_FACTOR : 1;
  const flat = instant ? 0 : reduced ? REDUCED_S : fast ? KNOB_MS / 1000 : undefined;
  const pos = flat !== undefined ? { duration: flat * k } : slow ? { duration: 0.9 * k / 2, ease: EASE } : SPRING;
  const fade = flat !== undefined ? { duration: flat * k } : { ...FADE, duration: FADE.duration * k };

  const highlight = scene.highlight?.length ? new Set(scene.highlight) : null;
  const delays = staggerDelays(diff.enter.map((e) => e.node), scene.sequence, reduced || instant ? 0 : STAGGER_S * k);
  const enterInfo = new Map(diff.enter.map((e) => [e.node.id, e]));
  const exiting = instant ? [] : diff.exit;
  const nodesForEdges = scene.nodes;

  return (
    <svg viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`} role="img" aria-label={ariaLabel} className={className} style={{ width: "100%", height: "auto", display: "block" }}>
      <defs>
        <marker id="tbt-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 z" fill="var(--tbt-ink)" />
        </marker>
        <pattern id="tbt-grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M20 0H0V20" fill="none" stroke="var(--tbt-grid)" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width={CANVAS_W} height={CANVAS_H} fill="var(--tbt-panel)" />
      <rect width={CANVAS_W} height={CANVAS_H} fill="url(#tbt-grid)" />
      {debugGrid && <DebugGrid />}

      {/* layer 1: edges */}
      <g>
        {scene.edges.map((e) => {
          const line = edgeLine(e, nodesForEdges);
          if (!line) return null;
          const isNew = diff.enterEdges.includes(e.id);
          const dim = highlight && !(highlight.has(e.from) && highlight.has(e.to)) ? DIM : 1;
          const target = { x1: line.a.x, y1: line.a.y, x2: line.b.x, y2: line.b.y, opacity: dim, pathLength: 1 };
          const edgeDelay = isNew && !instant ? (reduced ? 0 : EDGE_DRAW_S * k) : 0;
          return (
            <g key={e.id}>
              <motion.line
                initial={isNew && !instant ? { ...target, pathLength: 0, opacity: 0 } : false}
                animate={target}
                transition={{ default: pos, pathLength: { duration: (reduced ? REDUCED_S : EDGE_DRAW_S) * k, delay: edgeDelay }, opacity: { ...fade, delay: edgeDelay } }}
                stroke="var(--tbt-ink)" strokeWidth={1.5} strokeDasharray={e.style === "dashed" ? "6 5" : undefined} markerEnd="url(#tbt-arrow)"
              />
              {e.label && (
                <motion.text initial={false} animate={{ x: line.mid.x, y: line.mid.y - 8, opacity: dim }} transition={{ default: pos, opacity: fade }}
                  textAnchor="middle" fontFamily="var(--font-ui)" fontSize={13} fill="var(--tbt-muted)" style={{ paintOrder: "stroke", stroke: "var(--tbt-panel)", strokeWidth: 4 }}>
                  {e.label}
                </motion.text>
              )}
            </g>
          );
        })}
      </g>

      {/* layer 2: flows (packets travelling along edges) */}
      <FlowLayer scene={scene} reduced={Boolean(reduced)} />

      {/* layer 3: nodes (+ accent ring on highlighted ones, which is the overlay) */}
      <g>
        {[...scene.nodes.map((n) => ({ n, mode: "live" as const })), ...exiting.map((x) => ({ n: x.node, mode: "exit" as const, to: x.to }))].map((item) => {
          const { n } = item;
          const box = nodeBox(n);
          const info = enterInfo.get(n.id);
          const isExit = item.mode === "exit";
          const dimmed = highlight && !highlight.has(n.id);
          const base = n.state === "ghost" ? 0.55 : 1;
          const target = isExit
            ? { x: ("to" in item && item.to ? item.to.x : n.x), y: ("to" in item && item.to ? item.to.y : n.y), opacity: 0, scale: reduced ? 1 : 0.9 }
            : { x: n.x, y: n.y, opacity: dimmed ? DIM : base, scale: 1 };
          const hasTarget = isExit && "to" in item && item.to;
          const delay = info && !instant ? (delays.get(n.id) ?? 0) : 0;
          const initial = info && !instant
            ? { x: reduced ? n.x : info.from?.x ?? n.x, y: reduced ? n.y : info.from?.y ?? n.y, opacity: 0, scale: reduced ? 1 : 0.9 }
            : false;
          const transition = {
            x: { ...pos, delay: isExit && hasTarget ? 0 : delay },
            y: { ...pos, delay: isExit && hasTarget ? 0 : delay },
            opacity: isExit ? { duration: (flat !== undefined ? flat : EXIT_MS / 1000) * k, delay: hasTarget && !reduced ? 0.25 * k : 0 } : { ...fade, delay },
            scale: { ...fade, delay },
          };
          return (
            <motion.g key={n.id} initial={initial} animate={target} transition={transition} style={{ pointerEvents: "none" }}>
              {highlight?.has(n.id) && n.kind !== "vector" && n.kind !== "text" && (
                <motion.rect x={-5} y={-5} width={box.w + 10} height={box.h + 10} rx={12} fill="none" stroke="var(--tbt-accent)" strokeWidth={2}
                  initial={false} animate={{ opacity: 0.9 }} />
              )}
              <Glyph kind={n.kind} props={n.props} w={box.w} h={box.h} state={n.state} reduced={reduced} />
            </motion.g>
          );
        })}
      </g>
    </svg>
  );
}

function FlowLayer({ scene, reduced }: { scene: Scene; reduced: boolean }) {
  const flows = scene.flows ?? [];
  const refs = useRef<Record<string, SVGGElement | null>>({});
  const start = useRef<number | null>(null);
  const items = flows.flatMap((f) => {
    const edge = scene.edges.find((e) => e.id === f.edge);
    const line = edge ? edgeLine(edge, scene.nodes) : null;
    return line ? [{ f, line }] : [];
  });
  useAnimationFrame((t) => {
    if (reduced) return;
    start.current ??= t;
    const el = t - start.current;
    for (const { f, line } of items) {
      const dur = f.durationMs ?? 1600;
      for (let i = 0; i < f.packets; i++) {
        const g = refs.current[`${f.edge}:${i}`];
        if (!g) continue;
        const p = (((el / dur) + i / f.packets) % 1 + 1) % 1;
        const pt = lerp(line.a, line.b, p);
        g.setAttribute("transform", `translate(${pt.x.toFixed(1)} ${pt.y.toFixed(1)})`);
        g.setAttribute("opacity", String(Math.min(1, p * 8, (1 - p) * 8)));
      }
    }
  });
  return (
    <g aria-hidden="true">
      {items.map(({ f, line }) =>
        reduced ? (
          <text key={f.edge} x={line.mid.x} y={line.mid.y + 16} textAnchor="middle" fontFamily="var(--font-mono)" fontSize={12} fill="var(--tbt-muted)">
            × {f.packets}{f.label ? ` ${f.label}` : ""}
          </text>
        ) : (
          Array.from({ length: f.packets }, (_, i) => (
            <g key={`${f.edge}:${i}`} ref={(el) => { refs.current[`${f.edge}:${i}`] = el; }}>
              {f.label ? (
                <rect x={-13} y={-8} width={26} height={16} rx={4} fill={`var(--tbt-token-${(i % 8) + 1})`} stroke="var(--tbt-ink)" strokeWidth={1} />
              ) : (
                <circle r={6} fill={f.color ?? "var(--tbt-accent)"} />
              )}
            </g>
          ))
        ),
      )}
    </g>
  );
}

function DebugGrid() {
  const lines: React.ReactNode[] = [];
  for (let x = 0; x <= CANVAS_W; x += 20) {
    lines.push(<line key={`v${x}`} x1={x} y1={0} x2={x} y2={CANVAS_H} stroke="var(--tbt-line)" strokeWidth={x % 100 === 0 ? 1 : 0.4} />);
    if (x % 100 === 0) lines.push(<text key={`tx${x}`} x={x + 2} y={10} fontSize={9} fill="var(--tbt-muted)">{x}</text>);
  }
  for (let y = 0; y <= CANVAS_H; y += 20) {
    lines.push(<line key={`h${y}`} x1={0} y1={y} x2={CANVAS_W} y2={y} stroke="var(--tbt-line)" strokeWidth={y % 100 === 0 ? 1 : 0.4} />);
    if (y % 100 === 0 && y > 0) lines.push(<text key={`ty${y}`} x={2} y={y - 2} fontSize={9} fill="var(--tbt-muted)">{y}</text>);
  }
  return <g aria-hidden="true">{lines}</g>;
}

export type { Node };
