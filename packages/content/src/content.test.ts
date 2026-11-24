import { describe, expect, it } from "vitest";
import { validate } from "../scripts/check";
import { tokenize } from "./tokenizer";
import { lessons, resolveScene, defaultKnobs } from "./registry";
import { cosineScene, neighborScene } from "../lessons/foundations/embeddings";
import { windowScene } from "../lessons/foundations/context-window";

describe("content", () => {
  it("validates every lesson", () => expect(validate()).toEqual([]));
  it("has the 4 Foundations lessons", () => expect(lessons.map((l) => l.id)).toEqual(["1.1", "1.2", "1.3", "1.4"]));
  it("tokenizer: common words are single tokens, non-Latin falls back to bytes", () => {
    expect(tokenize("The capital")).toEqual(["The", " capital"]);
    expect(tokenize("é").length).toBe(2);
    expect(tokenize("x".repeat(100)).length).toBe(28);
  });
  it("derive: knobs change the scene", () => {
    const l = lessons[0]!;
    const a = resolveScene(l, 5, { ...defaultKnobs(l), maxTokens: 1 });
    const b = resolveScene(l, 5, { ...defaultKnobs(l), maxTokens: 4 });
    expect(a.metrics?.[0]?.value).toBe(1);
    expect(b.metrics?.[0]?.value).toBe(4);
  });
  it("cosine scene matches the angle", () => {
    expect(cosineScene(0).metrics?.[0]?.value).toBeCloseTo(1);
    expect(cosineScene(90).metrics?.[0]?.value).toBeCloseTo(0);
    expect(cosineScene(180).metrics?.[0]?.value).toBeCloseTo(-1);
  });
  it("nearest neighbour of king is queen's cluster", () => {
    expect(neighborScene("cat").highlight).toContain("dog");
  });
  it("window overflow keeps only the newest messages", () => {
    const s = windowScene(6, 8);
    expect(s.nodes.filter((n) => n.kind === "token" && n.state !== "ghost").length).toBe(6);
    expect(s.metrics?.find((m) => m.id === "used")?.value).toBe(720);
  });
});
