export type Props = Record<string, unknown>;

export const visible = (t: string) => t.replace(/^ /, "·").replace(/\n/g, "↵");
export const tokenWidth = (label: string) => Math.max(34, Math.round([...visible(label)].length * 9.5 + 18));
export const TILE_H = 36;
const GAP = 6;

const str = (v: unknown, d = "") => (typeof v === "string" ? v : d);
const arr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

/** Default box for a glyph, used when a node gives no w/h. */
export function glyphSize(kind: string, props: Props = {}): { w: number; h: number } {
  switch (kind) {
    case "token": return { w: tokenWidth(str(props.label)), h: TILE_H };
    case "tokenStrip": {
      const tokens = arr<string>(props.tokens);
      return { w: tokens.reduce((s, t) => s + tokenWidth(t), 0) + Math.max(0, tokens.length - 1) * GAP, h: TILE_H };
    }
    case "text": {
      const lines = str(props.label).split("\n");
      const size = typeof props.size === "number" ? props.size : 16;
      return { w: Math.max(...lines.map((l) => l.length)) * size * 0.58, h: lines.length * size * 1.4 };
    }
    case "vector": return { w: 1, h: 1 };
    case "model": return { w: 160, h: 110 };
    case "bars": return { w: 300, h: arr(props.items).length * 34 };
    case "callout": return { w: 220, h: 64 };
    case "user": return { w: 56, h: 72 };
    case "db": return { w: 64, h: 76 };
    case "tool": return { w: 76, h: 60 };
    case "agent": return { w: 84, h: 84 };
    case "layer": return { w: 160, h: 40 };
    case "grid": return { w: 120, h: 120 };
    case "box": return { w: 200, h: 100 };
    case "dot": return { w: 14, h: 14 };
    case "meter": return { w: 160, h: 22 };
    default: return { w: 80, h: 40 };
  }
}
