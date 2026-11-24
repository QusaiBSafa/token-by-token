"use client";
import { getLessonById } from "@tbt/content";
import { SceneCanvas, useLessonPlayer } from "@tbt/engine";

/** Muted, looping demo of lesson 1.1 for the landing page. */
export function AutoplayDemo() {
  const lesson = getLessonById("1.1")!;
  const { state, scene, step, reduced } = useLessonPlayer(lesson, 0, { keyboard: false, persist: false, autoplay: true });
  return (
    <figure className="frame" style={{ margin: 0 }}>
      <SceneCanvas scene={scene} ariaLabel={`Demo of lesson 1.1: ${step.title}`} instant={state.instant} reduced={reduced} />
      <figcaption className="frame-cap">
        <span>{step.title}</span>
        <span className="mono">{state.stepIndex + 1}/{state.total}</span>
      </figcaption>
    </figure>
  );
}
