import type { Node } from "./schema";

/** Visible form of a token: leading space becomes a middle dot, as in most tokenizer viewers. */
export const visible = (t: string) => t.replace(/^ /, "·").replace(/\n/g, "↵");

/** Keep in sync with packages/glyphs (tokenWidth). Lessons stay free of React imports. */
export const tokenWidth = (label: string) => Math.max(34, Math.round([...visible(label)].length * 9.5 + 18));
export const TILE_H = 36;
export const TILE_GAP = 6;

export const stripWidth = (tokens: string[]) =>
  tokens.reduce((s, t) => s + tokenWidth(t), 0) + Math.max(0, tokens.length - 1) * TILE_GAP;

/** Lay tokens in a centred row; returns one token node per label with stable ids `${prefix}${i}`. */
export function tokenRow(
  labels: string[],
  opts: { prefix: string; y: number; cx?: number; x?: number; ids?: number[]; extra?: (i: number) => Partial<Node> & { props?: Record<string, unknown> } },
): Node[] {
  const total = stripWidth(labels);
  let x = opts.x ?? (opts.cx ?? 480) - total / 2;
  return labels.map((label, i) => {
    const w = tokenWidth(label);
    const ex = opts.extra?.(i) ?? {};
    const node: Node = {
      id: `${opts.prefix}${i}`,
      kind: "token",
      x,
      y: opts.y,
      w,
      h: TILE_H,
      ...ex,
      props: { label, ...(opts.ids ? { id: opts.ids[i] } : {}), ...(ex.props ?? {}) },
    };
    x += w + TILE_GAP;
    return node;
  });
}

/** Wrap tokens into rows no wider than maxW starting at (x0, y0). */
export function tokenGrid(
  labels: string[],
  opts: { prefix: string; x0: number; y0: number; maxW: number; rowH?: number; ids?: number[] },
): Node[] {
  const out: Node[] = [];
  let x = opts.x0;
  let y = opts.y0;
  labels.forEach((label, i) => {
    const w = tokenWidth(label);
    if (x + w > opts.x0 + opts.maxW && x > opts.x0) {
      x = opts.x0;
      y += opts.rowH ?? 62;
    }
    out.push({ id: `${opts.prefix}${i}`, kind: "token", x, y, w, h: TILE_H, props: { label, ...(opts.ids ? { id: opts.ids[i] } : {}) } });
    x += w + TILE_GAP;
  });
  return out;
}
