"use client";
import { useMemo, useSyncExternalStore } from "react";
import { parseProgress, readRaw, subscribeProgress, type ProgressMap } from "./progress";

/** Reactive view of saved progress (localStorage), empty on the server. */
export function useProgress(): ProgressMap {
  const raw = useSyncExternalStore(subscribeProgress, () => readRaw(), () => "{}");
  return useMemo(() => parseProgress(raw), [raw]);
}
