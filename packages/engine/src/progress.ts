/** Progress lives in localStorage behind this wrapper so account sync can replace it later. */
export interface LessonProgress { lastStep: number; completedAt?: string; quiz?: { correct: boolean } }
export type ProgressMap = Record<string, LessonProgress>;
export const PROGRESS_KEY = "tbt:progress:v1";
const EVENT = "tbt:progress";

export function readRaw(storage: Pick<Storage, "getItem"> | null = safeStorage()): string {
  try { return storage?.getItem(PROGRESS_KEY) ?? "{}"; } catch { return "{}"; }
}
export function parseProgress(raw: string): ProgressMap {
  try {
    const v = JSON.parse(raw) as unknown;
    return v && typeof v === "object" ? (v as ProgressMap) : {};
  } catch { return {}; }
}
function safeStorage(): Storage | null {
  try { return typeof window === "undefined" ? null : window.localStorage; } catch { return null; }
}

export function recordStep(lessonId: string, stepIndex: number, totalSteps: number, storage: Pick<Storage, "getItem" | "setItem"> | null = safeStorage(), now = () => new Date().toISOString()): ProgressMap {
  const map = parseProgress(readRaw(storage));
  const prev = map[lessonId];
  const next: LessonProgress = { ...prev, lastStep: Math.max(prev?.lastStep ?? 0, stepIndex) };
  if (stepIndex >= totalSteps - 1 && !prev?.completedAt) next.completedAt = now();
  map[lessonId] = next;
  write(map, storage);
  return map;
}
export function recordQuiz(lessonId: string, correct: boolean, storage: Pick<Storage, "getItem" | "setItem"> | null = safeStorage()): ProgressMap {
  const map = parseProgress(readRaw(storage));
  map[lessonId] = { lastStep: 0, ...map[lessonId], quiz: { correct } };
  write(map, storage);
  return map;
}
function write(map: ProgressMap, storage: Pick<Storage, "setItem"> | null) {
  try {
    storage?.setItem(PROGRESS_KEY, JSON.stringify(map));
    if (typeof window !== "undefined") window.dispatchEvent(new Event(EVENT));
  } catch { /* storage blocked: progress simply does not persist */ }
}
export function subscribeProgress(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => { window.removeEventListener(EVENT, cb); window.removeEventListener("storage", cb); };
}
export const isComplete = (map: ProgressMap, lessonId: string) => Boolean(map[lessonId]?.completedAt);
