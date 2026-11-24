"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { caption, getLessonById, lessonHref, lessonsInModule, getModule } from "@tbt/content";
import { KnobControl, MetricList, QuizPanel, SceneCanvas, useLessonPlayer, useProgress } from "@tbt/engine";

export function LessonPlayer({ lessonId, initialStep }: { lessonId: string; initialStep: number }) {
  const lesson = getLessonById(lessonId)!;
  const mod = getModule(lesson.module)!;
  const siblings = lessonsInModule(lesson.module);
  const progress = useProgress();
  const { store, state, scene, step, gated, reduced } = useLessonPlayer(lesson, initialStep);
  const [slow] = useState(false);
  const first = useRef(true);
  const sideRef = useRef<HTMLDetailsElement>(null);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  useEffect(() => {
    if (window.innerWidth < 1024 && sideRef.current) sideRef.current.open = false;
  }, []);

  // keep the URL shareable without remounting the canvas
  useEffect(() => {
    if (first.current) { first.current = false; if (state.stepIndex === initialStep) return; }
    const path = state.stepIndex === 0 ? lessonHref(lesson) : lessonHref(lesson, step.id);
    window.history.replaceState(window.history.state, "", path);
  }, [state.stepIndex, step.id, lesson, initialStep]);

  const last = state.stepIndex === state.total - 1;
  const text = caption(step.captionKey);
  const knobs = (lesson.knobs ?? []).filter((k) => !k.showAtSteps || k.showAtSteps.includes(step.id));
  const showQuiz = lesson.quiz && lesson.quiz.revealAtStep === step.id;
  const idx = siblings.findIndex((l) => l.id === lesson.id);
  const nextLesson = siblings[idx + 1];
  const visited = progress[lesson.id]?.lastStep ?? 0;
  const { next, back, replay, goTo, setKnob, answerQuiz } = store.getState();

  const sendFeedback = (helpful: boolean) => {
    void fetch("/api/feedback", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ lessonId: lesson.id, stepId: step.id, helpful }) }).catch(() => {});
    setFb(helpful ? "up" : "down");
  };
  const [fb, setFb] = useState<"up" | "down" | null>(null);
  useEffect(() => setFb(null), [step.id]);

  return (
    <div className="wrap player" data-hydrated={hydrated}>
      <details className="side" ref={sideRef} open>
        <summary>{mod.title} · {siblings.length} lessons</summary>
        <ol>
          {siblings.map((l) => (
            <li key={l.id}>
              <Link href={lessonHref(l)} aria-current={l.id === lesson.id ? "page" : undefined}>
                <span className="tick" data-done={Boolean(progress[l.id]?.completedAt)} aria-hidden="true">{progress[l.id]?.completedAt ? "✓" : ""}</span>
                <span><span className="mono" style={{ color: "var(--tbt-muted)" }}>{l.number}</span> {l.title}{progress[l.id]?.completedAt ? <span className="sr-only"> (completed)</span> : null}</span>
              </Link>
            </li>
          ))}
        </ol>
      </details>

      <main>
        <h1 className="main-title">{lesson.number} {lesson.title}</h1>
        <p className="main-sub">{lesson.minutes} min · {lesson.traceSource === "illustrative" ? <span className="badge-illus" title="Numbers are hand-written to resemble real model output">illustrative data</span> : "real model data"}</p>
        <div className="canvas-wrap" data-testid="canvas">
          <SceneCanvas scene={scene} ariaLabel={`${step.title}. ${text}`} instant={state.instant} fast={state.fast} slow={slow} reduced={reduced} />
        </div>
        <div className="stepbar">
          <button type="button" className="btn" onClick={back} disabled={state.stepIndex === 0} aria-label="Back">← <span className="hide-sm">Back</span></button>
          <button type="button" className="btn btn-ghost" onClick={replay} aria-label="Replay this step (R)">↺ <span className="hide-sm">Replay</span></button>
          <div className="dots" role="group" aria-label="Steps">
            {lesson.steps.map((s, i) => (
              <button key={s.id} type="button" className="dot" aria-label={`Step ${i + 1}: ${s.title}`} aria-current={i === state.stepIndex ? "step" : undefined}
                data-visited={i <= visited} onClick={() => (i <= Math.max(visited, state.stepIndex) ? goTo(i) : undefined)} disabled={i > Math.max(visited, state.stepIndex) + 0} />
            ))}
          </div>
          <button type="button" className="btn btn-primary btn-next" onClick={next} disabled={last || gated} title={gated ? "Answer the question to continue" : undefined} data-testid="next">
            {gated ? "Answer to continue" : last ? "Done" : "Next"} <span aria-hidden="true">→</span>
          </button>
        </div>
      </main>

      <section className="panel" aria-label="Step details">
        <div className="sr-only" aria-live="polite" data-testid="live">{`Step ${state.stepIndex + 1} of ${state.total}: ${step.title}. ${text}`}</div>
        <div>
          <div className="step-count">Step {state.stepIndex + 1} of {state.total}</div>
          <h2 className="step-title" data-testid="step-title">{step.title}</h2>
          <p className="caption">{text}</p>
        </div>
        <MetricList metrics={scene.metrics} reduced={reduced} />
        {knobs.map((k) => <KnobControl key={k.id} knob={k} values={state.knobs} onChange={setKnob} />)}
        {showQuiz && lesson.quiz && <QuizPanel quiz={lesson.quiz} answer={state.quizAnswer} onAnswer={answerQuiz} />}
        {last && (
          <div className="complete" data-testid="complete">
            <h3>Lesson complete</h3>
            <ul>{lesson.takeaways.map((t) => <li key={t}>{t}</li>)}</ul>
            <p className="refs">Go deeper: {lesson.references.map((r, i) => (<span key={r.url}>{i > 0 ? " · " : ""}<a href={r.url} target="_blank" rel="noreferrer">{r.label}</a></span>))}</p>
            {nextLesson ? <Link className="btn btn-primary" href={lessonHref(nextLesson)}>Next lesson: {nextLesson.title} →</Link> : <Link className="btn btn-primary" href="/learn">Back to the course map</Link>}
          </div>
        )}
        <div className="feedback">
          <span>Was this step clear?</span>
          <button type="button" aria-label="Yes, clear" aria-pressed={fb === "up"} onClick={() => sendFeedback(true)}>👍</button>
          <button type="button" aria-label="No, confusing" aria-pressed={fb === "down"} onClick={() => sendFeedback(false)}>👎</button>
          {fb && <span role="status">Thanks!</span>}
        </div>
        <p className="step-count">← → step · R replay</p>
      </section>
      <style>{`@media (max-width: 520px){.hide-sm{display:none}}`}</style>
    </div>
  );
}
