"use client";
import { useEffect, useMemo, useRef } from "react";
import { useStore } from "zustand";
import { useReducedMotion } from "motion/react";
import { resolveScene, type Lesson, type Scene } from "@tbt/content";
import { createPlayerStore, isGated, type PlayerState } from "./store";
import { SETTLE_MS } from "./motion";
import { recordQuiz, recordStep } from "./progress";

export interface PlayerOptions {
  keyboard?: boolean;
  persist?: boolean;
  /** loop through steps using each step's autoAdvanceMs */
  autoplay?: boolean;
}

export function useLessonPlayer(lesson: Lesson, initialStep = 0, opts: PlayerOptions = {}) {
  const { keyboard = true, persist = true, autoplay = false } = opts;
  const store = useMemo(() => createPlayerStore(lesson, initialStep), [lesson.id]);
  const state = useStore(store) as PlayerState;
  const reducedPref = useReducedMotion();
  const reduced = Boolean(reducedPref);
  const scene: Scene = useMemo(() => resolveScene(lesson, state.sceneIndex, state.knobs), [lesson, state.sceneIndex, state.knobs]);
  const step = lesson.steps[state.stepIndex]!;
  const gated = isGated(lesson, state);

  useEffect(() => {
    if (state.status !== "animating") return;
    const t = setTimeout(() => store.getState().settle(), SETTLE_MS);
    return () => clearTimeout(t);
  }, [state.status, state.stepIndex, state.sceneIndex, state.knobs, store]);

  useEffect(() => {
    if (persist) recordStep(lesson.id, state.stepIndex, state.total);
  }, [persist, lesson.id, state.stepIndex, state.total]);

  const quizCorrect = lesson.quiz && state.quizAnswer !== undefined ? state.quizAnswer === lesson.quiz.answer : undefined;
  useEffect(() => {
    if (persist && quizCorrect !== undefined) recordQuiz(lesson.id, quizCorrect);
  }, [persist, lesson.id, quizCorrect]);

  useEffect(() => {
    if (!keyboard) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const el = e.target as HTMLElement | null;
      const tag = el?.tagName;
      const typing = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el?.isContentEditable;
      if (typing) return;
      const s = store.getState();
      if (e.key === "ArrowRight") { e.preventDefault(); s.next(); }
      else if (e.key === " " && tag !== "BUTTON" && tag !== "A") { e.preventDefault(); s.next(); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); s.back(); }
      else if ((e.key === "r" || e.key === "R") && tag !== "BUTTON") { s.replay(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [keyboard, store]);

  const autoRef = useRef(autoplay);
  autoRef.current = autoplay;
  useEffect(() => {
    if (!autoplay || reduced) return;
    const ms = step.autoAdvanceMs ?? 3000;
    const t = setTimeout(() => {
      const s = store.getState();
      if (s.stepIndex >= s.total - 1) s.goTo(0, { instant: false });
      else s.next();
    }, ms);
    return () => clearTimeout(t);
  }, [autoplay, reduced, state.stepIndex, step.autoAdvanceMs, store]);

  return { store, state, scene, step, gated, reduced };
}
