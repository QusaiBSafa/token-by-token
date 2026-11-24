import { motion } from "motion/react";
import type { ReactNode } from "react";
import { TILE_H, tokenWidth, visible, type Props } from "./size";

export type GlyphState = "idle" | "active" | "done" | "error" | "ghost";
export interface GlyphProps { kind: string; props?: Props; w: number; h: number; state?: GlyphState; reduced?: boolean }

const INK = "var(--tbt-ink)";
const PAPER = "var(--tbt-panel)";
const LINE = "var(--tbt-line)";
const MUTED = "var(--tbt-muted)";
const MONO = "var(--font-mono)";
const UI = "var(--font-ui)";
const SW = 1.5;

const num = (v: unknown, d: number) => (typeof v === "number" && Number.isFinite(v) ? v : d);
const str = (v: unknown, d = "") => (typeof v === "string" ? v : d);
const arr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
const tokenFill = (label: string, color?: unknown) => {
  let idx = typeof color === "number" ? color : 0;
  if (!idx) {
    let h = 0;
    for (let i = 0; i < label.length; i++) h = (h * 31 + label.charCodeAt(i)) >>> 0;
    idx = (h % 8) + 1;
  }
  return `var(--tbt-token-${((idx - 1) % 8) + 1})`;
};

export function stateStroke(state: GlyphState | undefined) {
  switch (state) {
    case "active": return { stroke: "var(--tbt-accent)", strokeWidth: 2.5 };
    case "done": return { stroke: "var(--tbt-ok)", strokeWidth: 2 };
    case "error": return { stroke: "var(--tbt-err)", strokeWidth: 2.5 };
    case "ghost": return { stroke: MUTED, strokeWidth: SW, strokeDasharray: "4 3" };
    default: return { stroke: INK, strokeWidth: SW };
  }
}

function Tile({ label, w, color, id, state, x = 0 }: { label: string; w: number; color?: unknown; id?: number; state?: GlyphState; x?: number }) {
  return (
    <g transform={`translate(${x} 0)`}>
      <rect width={w} height={TILE_H} rx={6} fill={tokenFill(label, color)} {...stateStroke(state)} />
      <text x={w / 2} y={TILE_H / 2 + 5} textAnchor="middle" fontFamily={MONO} fontSize={15} fill={INK}>{visible(label)}</text>
      {id !== undefined && (
        <text x={w / 2} y={TILE_H + 16} textAnchor="middle" fontFamily={MONO} fontSize={12} fill={MUTED}>{id}</text>
      )}
    </g>
  );
}

export function Glyph({ kind, props = {}, w, h, state = "idle", reduced }: GlyphProps): ReactNode {
  const st = stateStroke(state);
  switch (kind) {
    case "token": {
      const label = str(props.label);
      return <Tile label={label} w={w} color={props.color} id={typeof props.id === "number" ? props.id : undefined} state={state} />;
    }
    case "tokenStrip": {
      const tokens = arr<string>(props.tokens);
      const ids = arr<number>(props.ids);
      let x = 0;
      return (
        <g>
          {tokens.map((t, i) => {
            const tw = tokenWidth(t);
            const el = (
              <motion.g key={`${i}-${t}`} initial={reduced ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduced ? 0.15 : 0.35 }}>
                <Tile label={t} w={tw} x={x} id={ids[i]} state={state === "active" && i === tokens.length - 1 ? "active" : undefined} />
              </motion.g>
            );
            x += tw + 6;
            return el;
          })}
        </g>
      );
    }
    case "text": {
      const size = num(props.size, 16);
      const align = str(props.align, "left");
      const lines = str(props.label).split("\n");
      const anchor = align === "center" ? "middle" : align === "right" ? "end" : "start";
      const tx = align === "center" ? w / 2 : align === "right" ? w : 0;
      return (
        <text fontFamily={props.mono ? MONO : UI} fontSize={size} fill={state === "ghost" ? MUTED : INK} textAnchor={anchor}>
          {lines.map((l, i) => (
            <tspan key={i} x={tx} y={size + i * size * 1.4}>{l}</tspan>
          ))}
        </text>
      );
    }
    case "vector": {
      const angle = num(props.angle, 0);
      const len = num(props.len, 100);
      const label = str(props.label);
      const rad = (angle * Math.PI) / 180;
      const lx = Math.cos(rad) * (len + 14);
      const ly = -Math.sin(rad) * (len + 14);
      const color = tokenFill("", props.color ?? 5);
      return (
        <g>
          <motion.g style={{ originX: 0, originY: 0 }} initial={false} animate={{ rotate: -angle }} transition={{ duration: reduced ? 0.15 : 0.35 }}>
            <motion.line x1={0} y1={0} y2={0} initial={false} animate={{ x2: len }} stroke={INK} strokeWidth={3} strokeLinecap="round" />
            <motion.g initial={false} animate={{ x: len }}>
              <path d="M0 0 L-12 -6 L-12 6 Z" fill={INK} />
            </motion.g>
            <motion.line x1={0} y1={0} y2={0} initial={false} animate={{ x2: len }} stroke={color} strokeWidth={7} strokeLinecap="round" opacity={0.55} />
          </motion.g>
          <motion.text initial={false} animate={{ x: lx, y: ly }} fontFamily={MONO} fontSize={14} fill={INK} textAnchor="middle">{label}</motion.text>
          <circle r={4} fill={INK} />
        </g>
      );
    }
    case "model": {
      const label = str(props.label, "Model");
      return (
        <g>
          <rect x={10} y={10} width={w - 10} height={h - 10} rx={14} fill={PAPER} stroke={LINE} strokeWidth={SW} />
          <rect x={5} y={5} width={w - 10} height={h - 10} rx={14} fill={PAPER} stroke={LINE} strokeWidth={SW} />
          <rect width={w - 10} height={h - 10} rx={14} fill={PAPER} {...st} />
          {[0.25, 0.5, 0.75].map((f) => (
            <g key={f}>
              <circle cx={(w - 10) * 0.2} cy={(h - 10) * f} r={4} fill={INK} opacity={0.6} />
              <circle cx={(w - 10) * 0.5} cy={(h - 10) * (f === 0.5 ? 0.35 : f)} r={4} fill={INK} opacity={0.6} />
              <circle cx={(w - 10) * 0.8} cy={(h - 10) * f} r={4} fill={INK} opacity={0.6} />
            </g>
          ))}
          <text x={(w - 10) / 2} y={h - 18} textAnchor="middle" fontFamily={UI} fontSize={14} fontWeight={600} fill={INK}>{label}</text>
        </g>
      );
    }
    case "bars": {
      const items = arr<{ label: string; value: number; picked?: boolean }>(props.items);
      const labelW = 110;
      const barMax = Math.max(40, w - labelW - 50);
      const title = str(props.title);
      return (
        <g>
          {title && <text y={-10} fontFamily={UI} fontSize={12} fill={MUTED}>{title}</text>}
          {items.map((it, i) => (
            <g key={`${i}`} transform={`translate(0 ${i * 34})`}>
              <text y={20} x={labelW - 8} textAnchor="end" fontFamily={MONO} fontSize={14} fill={INK}>{visible(it.label)}</text>
              <rect x={labelW} y={4} width={barMax} height={22} rx={4} fill="none" stroke={LINE} strokeWidth={1} />
              <motion.rect x={labelW} y={4} height={22} rx={4} initial={false} animate={{ width: Math.max(2, it.value * barMax) }} transition={{ duration: reduced ? 0.15 : 0.45, ease: [0.22, 1, 0.36, 1] }}
                fill={it.picked ? "var(--tbt-accent)" : tokenFill(it.label)} stroke={it.picked ? "var(--tbt-accent)" : INK} strokeWidth={it.picked ? 2 : 1} />
              <text x={labelW + barMax + 8} y={20} fontFamily={MONO} fontSize={13} fill={INK}>{Math.round(it.value * 100)}%</text>
            </g>
          ))}
        </g>
      );
    }
    case "callout": {
      const lines = str(props.text, str(props.label)).split("\n");
      return (
        <g>
          <rect width={w} height={h} rx={10} fill={PAPER} {...(state === "idle" ? { stroke: "var(--tbt-accent)", strokeWidth: SW } : st)} />
          {lines.map((l, i) => (
            <text key={i} x={w / 2} y={h / 2 + (i - (lines.length - 1) / 2) * 18 + 5} textAnchor="middle" fontFamily={UI} fontSize={14} fill={INK}>{l}</text>
          ))}
        </g>
      );
    }
    case "box": {
      const label = str(props.label);
      return (
        <g>
          <rect width={w} height={h} rx={14} fill="none" {...(state === "idle" ? { stroke: LINE, strokeWidth: SW, strokeDasharray: "6 5" } : st)} />
          {label && <text x={14} y={-8} fontFamily={UI} fontSize={12} fill={MUTED}>{label}</text>}
        </g>
      );
    }
    case "user": {
      const label = str(props.label, "User");
      return (
        <g>
          <circle cx={w / 2} cy={18} r={14} fill={PAPER} {...st} />
          <path d={`M4 ${h - 14} Q${w / 2} 30 ${w - 4} ${h - 14} Z`} fill={PAPER} {...st} />
          <text x={w / 2} y={h + 4} textAnchor="middle" fontFamily={UI} fontSize={12} fill={MUTED}>{label}</text>
        </g>
      );
    }
    case "db": {
      const label = str(props.label);
      const rx = w / 2;
      return (
        <g>
          <path d={`M0 12 V${h - 12} A${rx} 12 0 0 0 ${w} ${h - 12} V12`} fill={PAPER} {...st} />
          <ellipse cx={rx} cy={12} rx={rx} ry={12} fill={PAPER} {...st} />
          <path d={`M0 ${h / 2} A${rx} 12 0 0 0 ${w} ${h / 2}`} fill="none" {...st} />
          {label && <text x={rx} y={h + 16} textAnchor="middle" fontFamily={UI} fontSize={12} fill={MUTED}>{label}</text>}
        </g>
      );
    }
    case "tool": {
      const label = str(props.label, "Tool");
      return (
        <g>
          <rect width={w} height={h} rx={10} fill={PAPER} {...st} />
          <circle cx={w / 2} cy={h / 2 - 6} r={11} fill="none" stroke={INK} strokeWidth={SW} />
          <circle cx={w / 2} cy={h / 2 - 6} r={4} fill={INK} />
          <text x={w / 2} y={h - 8} textAnchor="middle" fontFamily={UI} fontSize={11} fill={INK}>{label}</text>
        </g>
      );
    }
    case "agent": {
      const label = str(props.label, "Agent");
      return (
        <g>
          <rect width={w} height={h} rx={h / 2} fill={PAPER} {...st} />
          <circle cx={w / 2 - 14} cy={h / 2 - 6} r={4} fill={INK} />
          <circle cx={w / 2 + 14} cy={h / 2 - 6} r={4} fill={INK} />
          <path d={`M${w / 2 - 14} ${h / 2 + 10} Q${w / 2} ${h / 2 + 20} ${w / 2 + 14} ${h / 2 + 10}`} fill="none" stroke={INK} strokeWidth={SW} />
          <text x={w / 2} y={h + 16} textAnchor="middle" fontFamily={UI} fontSize={12} fill={MUTED}>{label}</text>
        </g>
      );
    }
    case "layer": {
      const label = str(props.label, "Layer");
      return (
        <g>
          <rect width={w} height={h} rx={8} fill={tokenFill(label, props.color)} {...st} />
          <text x={w / 2} y={h / 2 + 5} textAnchor="middle" fontFamily={UI} fontSize={14} fill={INK}>{label}</text>
        </g>
      );
    }
    case "grid": {
      const cells = arr<number[]>(props.cells);
      const rows = cells.length || 1;
      const cols = cells[0]?.length || 1;
      const cw = w / cols;
      const ch = h / rows;
      return (
        <g>
          {cells.map((row, r) => row.map((v, c) => (
            <motion.rect key={`${r}-${c}`} x={c * cw} y={r * ch} width={cw - 1} height={ch - 1} fill="var(--tbt-accent)" initial={false} animate={{ opacity: Math.max(0.05, Math.min(1, v)) }} />
          )))}
          <rect width={w} height={h} fill="none" {...st} />
        </g>
      );
    }
    case "dot": {
      const label = str(props.label);
      return (
        <g>
          <circle cx={w / 2} cy={h / 2} r={Math.min(w, h) / 2} fill={tokenFill(label, props.color)} {...st} />
          {label && <text x={w + 6} y={h / 2 + 4} fontFamily={MONO} fontSize={13} fill={INK}>{label}</text>}
        </g>
      );
    }
    case "meter": {
      const value = Math.max(0, Math.min(1, num(props.value, 0)));
      return (
        <g>
          <rect width={w} height={h} rx={h / 2} fill="none" {...st} />
          <motion.rect height={h} rx={h / 2} fill="var(--tbt-accent)" initial={false} animate={{ width: Math.max(h, value * w) }} />
        </g>
      );
    }
    default:
      return <rect width={w} height={h} fill="none" stroke="var(--tbt-err)" strokeDasharray="4 3" />;
  }
}
