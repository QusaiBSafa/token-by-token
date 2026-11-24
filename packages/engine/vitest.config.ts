import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    coverage: { provider: "v8", include: ["src/diff.ts", "src/store.ts", "src/format.ts", "src/geometry.ts", "src/progress.ts"], thresholds: { lines: 90 } },
  },
});
