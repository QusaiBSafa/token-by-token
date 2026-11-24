import type { ModuleMeta } from "./schema";

export const modules: ModuleMeta[] = [
  { id: "foundations", number: 1, title: "Foundations", blurb: "What happens when you send one prompt.", accent: "#2F6FED", live: true },
  { id: "inside-the-model", number: 2, title: "Inside the model", blurb: "Transformers, attention and training.", accent: "#7A4FE0", live: false },
  { id: "prompting", number: 3, title: "Prompting and control", blurb: "Instructions, structure and sampling.", accent: "#0F9D8A", live: false },
  { id: "retrieval", number: 4, title: "Retrieval and RAG", blurb: "Give the model your data.", accent: "#D9730D", live: false },
  { id: "agents", number: 5, title: "Tools and agents", blurb: "Models that act.", accent: "#C23B5A", live: false },
  { id: "evals", number: 6, title: "Evaluation", blurb: "Know whether it works.", accent: "#4F7A28", live: false },
  { id: "serving", number: 7, title: "Serving and scale", blurb: "Latency, cost and throughput.", accent: "#2A7FB8", live: false },
  { id: "safety", number: 8, title: "Safety and security", blurb: "Injection, privacy and guardrails.", accent: "#8A4B2E", live: false },
  { id: "whole-systems", number: 9, title: "Whole systems", blurb: "Design a production AI system.", accent: "#555F6B", live: false },
];
