/** Design tokens ("lab bench"). CSS variables live in tokens.css; this file mirrors them for TS use. */
export const moduleAccents = {
  foundations: "#2F6FED",
  "inside-the-model": "#7A4FE0",
  "data-retrieval": "#0F9D8A",
  agents: "#D9730D",
  serving: "#C23B5A",
} as const;

export const tokenPaletteSize = 8;

/** Stable colour index for a token label so the same token keeps its colour across lessons. */
export function tokenColorIndex(label: string): number {
  let h = 0;
  for (let i = 0; i < label.length; i++) h = (h * 31 + label.charCodeAt(i)) >>> 0;
  return (h % tokenPaletteSize) + 1;
}

export const fonts = {
  ui: "Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
  mono: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
} as const;
