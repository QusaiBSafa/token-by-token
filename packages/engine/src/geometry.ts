import { glyphSize } from "@tbt/glyphs";
import type { Edge, Node } from "@tbt/content";

export interface Box { x: number; y: number; w: number; h: number }
export interface Pt { x: number; y: number }

export function nodeBox(n: Node): Box {
  const d = glyphSize(n.kind, n.props);
  return { x: n.x, y: n.y, w: n.w ?? d.w, h: n.h ?? d.h };
}
export const center = (b: Box): Pt => ({ x: b.x + b.w / 2, y: b.y + b.h / 2 });

/** Point on the boundary of box `b` along the ray from its centre towards `towards`. */
export function boundaryPoint(b: Box, towards: Pt, pad = 4): Pt {
  const c = center(b);
  const dx = towards.x - c.x;
  const dy = towards.y - c.y;
  if (dx === 0 && dy === 0) return c;
  const hw = b.w / 2 + pad;
  const hh = b.h / 2 + pad;
  const s = Math.min(dx !== 0 ? hw / Math.abs(dx) : Infinity, dy !== 0 ? hh / Math.abs(dy) : Infinity);
  return { x: c.x + dx * s, y: c.y + dy * s };
}

export interface EdgeLine { a: Pt; b: Pt; mid: Pt; length: number }

export function edgeLine(edge: Edge, nodes: Node[]): EdgeLine | null {
  const from = nodes.find((n) => n.id === edge.from);
  const to = nodes.find((n) => n.id === edge.to);
  if (!from || !to) return null;
  const fb = nodeBox(from);
  const tb = nodeBox(to);
  const a = boundaryPoint(fb, center(tb));
  const b = boundaryPoint(tb, center(fb), 8);
  return { a, b, mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, length: Math.hypot(b.x - a.x, b.y - a.y) };
}

export const lerp = (a: Pt, b: Pt, t: number): Pt => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
