"use client";
import { useId } from "react";
import type { Knob, KnobValues, Quiz as QuizDef } from "@tbt/content";

export function KnobControl({ knob, values, onChange }: { knob: Knob; values: KnobValues; onChange: (id: string, v: number | string) => void }) {
  const id = useId();
  const value = values[knob.id] ?? knob.default;
  return (
    <div className="tbt-knob">
      <label htmlFor={id} className="tbt-knob-label">{knob.label}</label>
      {knob.kind === "slider" && (
        <div className="tbt-knob-row">
          <input id={id} type="range" min={knob.min} max={knob.max} step={knob.step} value={Number(value)} onChange={(e) => onChange(knob.id, Number(e.target.value))} />
          <output htmlFor={id} className="tbt-knob-value">{String(value)}</output>
        </div>
      )}
      {knob.kind === "select" && (
        <select id={id} value={String(value)} onChange={(e) => onChange(knob.id, e.target.value)}>
          {knob.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      )}
      {knob.kind === "text" && (
        <input id={id} type="text" value={String(value)} maxLength={knob.maxLength} onChange={(e) => onChange(knob.id, e.target.value)} dir="auto" />
      )}
    </div>
  );
}

export function QuizPanel({ quiz, answer, onAnswer }: { quiz: QuizDef; answer: number | undefined; onAnswer: (i: number) => void }) {
  const answered = answer !== undefined;
  return (
    <fieldset className="tbt-quiz" data-testid="quiz">
      <legend>Check yourself</legend>
      <p className="tbt-quiz-q">{quiz.question}</p>
      <div className="tbt-quiz-choices">
        {quiz.choices.map((c, i) => {
          const state = !answered ? "" : i === quiz.answer ? "correct" : i === answer ? "wrong" : "";
          return (
            <button key={c} type="button" className="tbt-quiz-choice" data-state={state} disabled={answered} aria-pressed={answer === i} onClick={() => onAnswer(i)}>
              {c}
            </button>
          );
        })}
      </div>
      {answered && (
        <p className="tbt-quiz-explain" role="status">
          <strong>{answer === quiz.answer ? "Right. " : "Not quite. "}</strong>{quiz.explanation}
        </p>
      )}
    </fieldset>
  );
}
