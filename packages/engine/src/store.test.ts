import { describe, expect, it } from "vitest";
import { lessons } from "@tbt/content";
import { createPlayerStore, isGated } from "./store";

const lesson = lessons[0]!; // 1.1, quiz gate at "append" (index 4)
const mk = (start = 0) => { const q: (() => void)[] = []; const s = createPlayerStore(lesson, start, (fn) => void q.push(fn)); return { s, q }; };

describe("player store", () => {
  it("starts instant on the deep-linked step", () => {
    const { s } = mk(2);
    expect(s.getState().stepIndex).toBe(2);
    expect(s.getState().instant).toBe(true);
  });
  it("clamps out-of-range deep links", () => {
    expect(mk(99).s.getState().stepIndex).toBe(lesson.steps.length - 1);
    expect(mk(-4).s.getState().stepIndex).toBe(0);
  });
  it("next and back move one step and animate", () => {
    const { s } = mk();
    s.getState().next();
    expect(s.getState()).toMatchObject({ stepIndex: 1, status: "animating", instant: false });
    s.getState().back();
    expect(s.getState().stepIndex).toBe(0);
    s.getState().back();
    expect(s.getState().stepIndex).toBe(0);
  });
  it("next while animating still advances (finish-on-Next)", () => {
    const { s } = mk();
    s.getState().next();
    s.getState().next();
    expect(s.getState().stepIndex).toBe(2);
  });
  it("quiz gate blocks Next until answered", () => {
    const { s } = mk(4);
    expect(isGated(lesson, s.getState())).toBe(true);
    s.getState().next();
    expect(s.getState().stepIndex).toBe(4);
    s.getState().answerQuiz(1);
    s.getState().next();
    expect(s.getState().stepIndex).toBe(5);
  });
  it("first quiz answer sticks", () => {
    const { s } = mk(4);
    s.getState().answerQuiz(0);
    s.getState().answerQuiz(2);
    expect(s.getState().quizAnswer).toBe(0);
  });
  it("cannot go past the last step", () => {
    const { s } = mk(lesson.steps.length - 1);
    s.getState().next();
    expect(s.getState().stepIndex).toBe(lesson.steps.length - 1);
  });
  it("replay jumps to the previous scene instantly, then animates forward", () => {
    const { s, q } = mk(3);
    s.getState().replay();
    expect(s.getState()).toMatchObject({ sceneIndex: 2, instant: true });
    q[0]!();
    expect(s.getState()).toMatchObject({ sceneIndex: 3, instant: false });
  });
  it("replay is dropped if the learner moved on", () => {
    const { s, q } = mk(3);
    s.getState().replay();
    s.getState().next();
    q[0]!();
    expect(s.getState().sceneIndex).toBe(4);
  });
  it("knob change uses the fast tween", () => {
    const { s } = mk(5);
    s.getState().setKnob("maxTokens", 2);
    expect(s.getState()).toMatchObject({ fast: true, instant: false });
    expect(s.getState().knobs.maxTokens).toBe(2);
  });
  it("goTo and settle", () => {
    const { s } = mk();
    s.getState().goTo(3, { instant: true });
    expect(s.getState()).toMatchObject({ stepIndex: 3, instant: true, status: "animating" });
    s.getState().settle();
    expect(s.getState().status).toBe("settled");
  });
});
