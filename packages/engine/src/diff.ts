import type { Node, Scene } from "@tbt/content";
import { nodeBox } from "./geometry";

export interface EnterNode { node: Node; from?: { x: number; y: number } }
export interface ExitNode { node: Node; to?: { x: number; y: number } }
export interface SceneDiff { enter: EnterNode[]; update: Node[]; exit: ExitNode[]; enterEdges: string[] }

const str = (v: unknown) => (typeof v === "string" ? v : undefined);
const strs = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);

/** Where a node's top-left sits, as a motion origin. */
const pos = (n: Node) => ({ x: n.x, y: n.y });

/**
 * Compare two scenes by node id.
 *  enter  id only in next. `props.from` names a node in prev whose position it flies out of.
 *  update id in both.
 *  exit   id only in prev. A next node's `props.absorb` list, or the exiting node's own `props.to`,
 *         names the node it merges into before fading.
 */
export function diffScenes(prev: Scene | null, next: Scene): SceneDiff {
  if (!prev) return { enter: [], update: next.nodes, exit: [], enterEdges: [] };
  const prevById = new Map(prev.nodes.map((n) => [n.id, n]));
  const nextById = new Map(next.nodes.map((n) => [n.id, n]));
  const enter: EnterNode[] = [];
  const update: Node[] = [];
  for (const node of next.nodes) {
    if (prevById.has(node.id)) {
      update.push(node);
      continue;
    }
    const fromId = str(node.props?.from);
    const src = fromId ? prevById.get(fromId) ?? nextById.get(fromId) : undefined;
    // spawn from the centre of the source so a small token appears to leave a larger node
    const from = src ? centreAt(src, node) : undefined;
    enter.push({ node, from });
  }
  const absorbedBy = new Map<string, Node>();
  for (const n of next.nodes) for (const id of strs(n.props?.absorb)) absorbedBy.set(id, n);
  const exit: ExitNode[] = [];
  for (const node of prev.nodes) {
    if (nextById.has(node.id)) continue;
    const toId = str(node.props?.to);
    const target = absorbedBy.get(node.id) ?? (toId ? nextById.get(toId) : undefined);
    exit.push({ node, to: target ? centreAt(target, node) : undefined });
  }
  const prevEdges = new Set(prev.edges.map((e) => e.id));
  const enterEdges = next.edges.filter((e) => !prevEdges.has(e.id)).map((e) => e.id);
  return { enter, update, exit, enterEdges };
}

function centreAt(target: Node, mover: Node) {
  const tb = nodeBox(target);
  const mb = nodeBox(mover);
  return { x: tb.x + tb.w / 2 - mb.w / 2, y: tb.y + tb.h / 2 - mb.h / 2 };
}

/** Reading order (top to bottom, left to right) stagger delays in seconds, honouring `sequence`. */
export function staggerDelays(nodes: Node[], sequence: Scene["sequence"], step: number): Map<string, number> {
  const out = new Map<string, number>();
  if (sequence?.length) for (const s of sequence) for (const id of s.ids) out.set(id, s.at);
  const rest = nodes.filter((n) => !out.has(n.id)).sort((a, b) => a.y - b.y || a.x - b.x);
  rest.forEach((n, i) => out.set(n.id, i * step));
  return out;
}

export { pos as _pos };
