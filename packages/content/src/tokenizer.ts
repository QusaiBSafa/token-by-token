/**
 * A tiny, deterministic, ILLUSTRATIVE tokenizer for the lesson 1.2 knob. It mimics the shape of
 * byte-level BPE (common words are one token, rare words split into subwords, non-Latin text
 * falls back to bytes) without shipping a real vocabulary. Real merge data comes from tools/traces.
 */
const VOCAB = new Set(
  [
    "the", " the", "The", " of", " and", " a", " to", " in", " is", " it", " for", " that", " with", " on", " are",
    "Hello", " world", " Hello", "Token", " token", " tokens", " Tokens", " capital", " France", " Paris", " results",
    "Un", "believ", "able", "ing", "ion", "ed", "er", "est", "ly", "un", "re", "pre", "tion", "ment", "ness",
    " model", " language", " learn", " learning", " machine", " AI", " data", " code", " function", " return",
    "def", " def", "print", "import", "const", " const", "let", " let", "{", "}", "(", ")", "=>", "==", "!", ",", ".", "?", ":",
    ";", "\"", "'", "-", "_", "/", "+", "*", "#",
  ].flatMap((w) => [w]),
);
const SUBWORDS = [...VOCAB].filter((w) => w.length > 1).sort((a, b) => b.length - a.length);

/** Stable pseudo id in a GPT-2-sized range, for display only. */
export function pseudoId(token: string): number {
  let h = 2166136261;
  for (let i = 0; i < token.length; i++) h = Math.imul(h ^ token.charCodeAt(i), 16777619) >>> 0;
  return 100 + (h % 50000);
}

export function tokenize(text: string, max = 28): string[] {
  const pieces = text.match(/ ?\p{L}+| ?\p{N}+| ?[^\s\p{L}\p{N}]|\s+/gu) ?? [];
  const out: string[] = [];
  for (const piece of pieces) {
    if (out.length >= max) break;
    if (VOCAB.has(piece)) {
      out.push(piece);
      continue;
    }
    let rest = piece;
    while (rest.length > 0 && out.length < max) {
      const hit = SUBWORDS.find((s) => rest.startsWith(s));
      if (hit) {
        out.push(hit);
        rest = rest.slice(hit.length);
        continue;
      }
      let ch = [...rest][0]!;
      if (ch === " " && rest.length > 1) ch = rest.slice(0, 2).length === 2 && rest.charCodeAt(1) < 128 ? rest.slice(0, 2) : ch;
      rest = rest.slice(ch.length);
      if (ch.charCodeAt(ch.length - 1) < 128) out.push(ch);
      else
        for (const b of new TextEncoder().encode(ch)) {
          if (out.length < max) out.push(`<0x${b.toString(16).toUpperCase().padStart(2, "0")}>`);
        }
    }
  }
  return out;
}
