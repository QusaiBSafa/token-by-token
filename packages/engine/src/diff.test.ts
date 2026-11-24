import { describe, expect, it } from "vitest";
import type { Node, Scene } from "@tbt/content";
import { diffScenes, staggerDelays } from "./diff";

const n = (id: string, x: number, y: number, props: Record<string, unknown> = {}): Node => ({ id, kind: "token", x, y, w: 40, h: 36, props: { label: id, ...props } });
const scene = (nodes: Node[], edges: Scene["edges"] = []): Scene => ({ nodes, edges });

describe("diffScenes", () => {
  it("first scene updates everything and enters nothing", () => {
    const d = diffScenes(null, scene([n("a", 0, 0)]));
    expect(d.enter).toHaveLength(0);
    expect(d.update).toHaveLength(1);
  });
  it("classifies enter, update and exit by id", () => {
    const d = diffScenes(scene([n("a", 0, 0), n("b", 50, 0)]), scene([n("b", 90, 0), n("c", 120, 0)]));
    expect(d.enter.map((e) => e.node.id)).toEqual(["c"]);
    expect(d.update.map((u) => u.id)).toEqual(["b"]);
    expect(d.exit.map((e) => e.node.id)).toEqual(["a"]);
  });
  it("enter with props.from starts at the source node", () => {
    const d = diffScenes(scene([{ ...n("src", 100, 100), w: 200, h: 50 }]), scene([n("a", 0, 0, { from: "src" })]));
    expect(d.enter[0]?.from).toEqual({ x: 100 + 100 - 20, y: 100 + 25 - 18 });
  });
  it("enter with an unknown from has no origin", () => {
    expect(diffScenes(scene([]), scene([n("a", 0, 0, { from: "nope" })])).enter[0]?.from).toBeUndefined();
  });
  it("exit moves into the node that absorbs it", () => {
    const d = diffScenes(scene([n("a", 0, 0), n("b", 50, 0)]), scene([n("ab", 10, 0, { absorb: ["a", "b"] })]));
    expect(d.exit.map((e) => e.to !== undefined)).toEqual([true, true]);
  });
  it("exit honours props.to on the leaving node", () => {
    const d = diffScenes(scene([n("a", 0, 0, { to: "z" })]), scene([n("z", 200, 100)]));
    expect(d.exit[0]?.to).toEqual({ x: 200, y: 100 });
  });
  it("reports edges that are new", () => {
    const d = diffScenes(scene([], [{ id: "e1", from: "a", to: "b" }]), scene([], [{ id: "e1", from: "a", to: "b" }, { id: "e2", from: "a", to: "b" }]));
    expect(d.enterEdges).toEqual(["e2"]);
  });
});

describe("staggerDelays", () => {
  it("staggers in reading order, 40 ms apart", () => {
    const m = staggerDelays([n("b", 50, 0), n("a", 0, 0), n("c", 0, 40)], undefined, 0.04);
    expect([m.get("a"), m.get("b"), m.get("c")]).toEqual([0, 0.04, 0.08]);
  });
  it("explicit sequence wins", () => {
    const m = staggerDelays([n("a", 0, 0), n("b", 50, 0)], [{ ids: ["b"], at: 0.3 }], 0.04);
    expect(m.get("b")).toBe(0.3);
    expect(m.get("a")).toBe(0);
  });
});
