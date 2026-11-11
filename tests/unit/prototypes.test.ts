import { expect, it } from "vitest";
import { validAnswers } from "../../src/features/cpa/prototype";
import { createDemoSession, findDemoSession, deleteDemoSession } from "../../src/features/demo/session-store";
it("accepts only three bounded integer choices, no identity payload", () => {
  expect(validAnswers([1, 3, 5])).toBe(true);
  for (const answers of [[], [1], [0, 2, 3], [1.5, 2, 3], [6, 2, 3], [1, 2, 3, 4], [NaN, 2, 3]]) expect(validAnswers(answers)).toBe(false);
});
it("isolates, expires and removes synthetic sessions", () => {
  const id = createDemoSession(100); const other = createDemoSession(100);
  expect(findDemoSession(id, 200)).toBeDefined(); expect(findDemoSession(undefined)).toBeUndefined();
  deleteDemoSession(id); expect(findDemoSession(id, 200)).toBeUndefined(); expect(findDemoSession(other, 200)).toBeDefined();
  expect(findDemoSession(other, 1_000_000)).toBeUndefined(); deleteDemoSession(undefined);
  createDemoSession(2_000_000); const latest = createDemoSession(3_000_000); deleteDemoSession(latest);
});
