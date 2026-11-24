"use client";
import { useState } from "react";
import { caption, getLessonById } from "@tbt/content";
import { KnobControl, MetricList, SceneCanvas, useLessonPlayer } from "@tbt/engine";

/** Dev-only: canvas with a coordinate grid, step list, knobs, copy-scene-JSON and slow motion. */
export function Authoring({ lessonId }: { lessonId: string }) {
  const lesson = getLessonById(lessonId)!;
  const { store, state, scene, step, reduced } = useLessonPlayer(lesson, 0, { persist: false });
  const [slow, setSlow] = useState(false);
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(JSON.stringify(scene, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };
  const { goTo, next, back, replay, setKnob } = store.getState();
  return (
    <main className="wrap section">
      <h1>{lesson.number} {lesson.title} <span className="pill">authoring</span></h1>
      <div className="dev-bar">
        <button className="btn" onClick={back}>← Back</button>
        <button className="btn" onClick={next}>Next →</button>
        <button className="btn" onClick={replay}>↺ Replay</button>
        <button className="btn" aria-pressed={slow} onClick={() => setSlow((s) => !s)}>Slow motion 0.25× {slow ? "on" : "off"}</button>
        <button className="btn" onClick={copy}>{copied ? "Copied" : "Copy scene JSON"}</button>
      </div>
      <div className="player" style={{ paddingBlock: 0 }}>
        <ol style={{ margin: 0, paddingInlineStart: 18 }}>
          {lesson.steps.map((s, i) => (
            <li key={s.id}><button className="btn btn-ghost" style={{ minHeight: 32, marginBlock: 2, fontWeight: i === state.stepIndex ? 700 : 400 }} onClick={() => goTo(i)}>{s.id}</button></li>
          ))}
        </ol>
        <div>
          <div className="canvas-wrap"><SceneCanvas scene={scene} ariaLabel={step.title} instant={state.instant} fast={state.fast} slow={slow} reduced={reduced} debugGrid /></div>
        </div>
        <div className="panel">
          <p className="caption">{caption(step.captionKey)}</p>
          <MetricList metrics={scene.metrics} reduced={reduced} />
          {(lesson.knobs ?? []).map((k) => <KnobControl key={k.id} knob={k} values={state.knobs} onChange={setKnob} />)}
        </div>
      </div>
    </main>
  );
}
