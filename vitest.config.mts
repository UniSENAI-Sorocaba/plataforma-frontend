import { defineConfig } from "vitest/config";
export default defineConfig({ test: { include: ["tests/unit/**/*.test.ts"], coverage: { provider: "v8", include: ["src/features/**/*.ts"], reporter: ["text", "json-summary", "html"], thresholds: { lines: 70, branches: 70, functions: 70, statements: 70 } } } });
