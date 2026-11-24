import { describe, expect, it } from "vitest";
import { formatMetric, severity } from "./format";
import { boundaryPoint, edgeLine, lerp } from "./geometry";
import { isComplete, parseProgress, recordQuiz, recordStep, readRaw } from "./progress";

describe("formatMetric", () => {
  it("formats each kind", () => {
    expect(formatMetric(12345, "int")).toBe("12,345");
    expect(formatMetric(0.5, "pct")).toBe("50%");
    expect(formatMetric(420, "ms")).toBe("420 ms");
    expect(formatMetric(0.1234, "usd")).toBe("$0.1234");
    expect(formatMetric(12.5, "usd")).toBe("$12.50");
    expect(formatMetric(0.5, "dec")).toBe("0.50");
    expect(formatMetric("—", "int")).toBe("—");
    expect(formatMetric(7.4, undefined)).toBe("7");
  });
  it("severity thresholds", () => {
    expect(severity(5, 10, 20)).toBe("ok");
    expect(severity(10, 10, 20)).toBe("warn");
    expect(severity(20, 10, 20)).toBe("danger");
    expect(severity("x", 1, 2)).toBe("ok");
  });
});

describe("geometry", () => {
  it("boundary point lies on the box edge", () => {
    const p = boundaryPoint({ x: 0, y: 0, w: 100, h: 50 }, { x: 300, y: 25 }, 0);
    expect(p).toEqual({ x: 100, y: 25 });
    expect(boundaryPoint({ x: 0, y: 0, w: 10, h: 10 }, { x: 5, y: 5 })).toEqual({ x: 5, y: 5 });
  });
  it("edgeLine connects two nodes and skips missing ones", () => {
    const nodes = [
      { id: "a", kind: "box" as const, x: 0, y: 0, w: 100, h: 100 },
      { id: "b", kind: "box" as const, x: 300, y: 0, w: 100, h: 100 },
    ];
    const line = edgeLine({ id: "e", from: "a", to: "b" }, nodes)!;
    expect(line.a.x).toBeLessThan(line.b.x);
    expect(line.length).toBeGreaterThan(0);
    expect(edgeLine({ id: "e", from: "a", to: "zz" }, nodes)).toBeNull();
    expect(lerp({ x: 0, y: 0 }, { x: 10, y: 10 }, 0.5)).toEqual({ x: 5, y: 5 });
  });
});

describe("progress", () => {
  const mem = () => { const d: Record<string, string> = {}; return { getItem: (k: string) => d[k] ?? null, setItem: (k: string, v: string) => void (d[k] = v) }; };
  it("records the furthest step and completes on the last", () => {
    const s = mem();
    recordStep("1.1", 2, 6, s);
    recordStep("1.1", 1, 6, s);
    expect(parseProgress(readRaw(s))["1.1"]?.lastStep).toBe(2);
    expect(isComplete(parseProgress(readRaw(s)), "1.1")).toBe(false);
    recordStep("1.1", 5, 6, s, () => "2026-01-01");
    expect(parseProgress(readRaw(s))["1.1"]?.completedAt).toBe("2026-01-01");
  });
  it("stores quiz result and survives bad json", () => {
    const s = mem();
    recordQuiz("1.2", true, s);
    expect(parseProgress(readRaw(s))["1.2"]?.quiz?.correct).toBe(true);
    expect(parseProgress("not json")).toEqual({});
    expect(parseProgress("5")).toEqual({});
    expect(readRaw(null)).toBe("{}");
  });
  it("swallows storage errors", () => {
    const boom = { getItem: () => { throw new Error("x"); }, setItem: () => { throw new Error("x"); } };
    expect(readRaw(boom)).toBe("{}");
    expect(() => recordStep("1.1", 0, 3, boom)).not.toThrow();
  });
});
