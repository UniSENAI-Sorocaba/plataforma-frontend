import assert from "node:assert/strict";
import test from "node:test";
import { validateRubricScores } from "../src/features/academic-pi/rubrics/score-validation.mjs";

const criteria = [
  { id: "research", minimum: 0, maximum: 5 },
  { id: "impact", minimum: 0, maximum: 10 },
];

test("validates each entered value against bounds supplied by the rubric", () => {
  assert.deepEqual(
    validateRubricScores(criteria, { research: "4.5", impact: "8" }),
    {
      errors: {},
      scores: [
        { criterionId: "research", value: 4.5 },
        { criterionId: "impact", value: 8 },
      ],
    },
  );
});

test("rejects missing, malformed, out-of-range values and invalid rubric configuration", () => {
  assert.equal(validateRubricScores(criteria, { research: "4" }).scores, null);
  assert.equal(validateRubricScores(criteria, { research: "x", impact: "8" }).errors.research, "Informe um número válido.");
  assert.ok(validateRubricScores(criteria, { research: "6", impact: "8" }).errors.research);
  assert.ok(validateRubricScores([], {}).errors._form);
  assert.ok(validateRubricScores([{ id: "x", minimum: 5, maximum: 1 }], { x: "3" }).errors.x);
  assert.ok(validateRubricScores([{ id: "", minimum: 0, maximum: 1 }], { "": "0" }).errors._form);
});

test("does not calculate a weighted or rounded result", () => {
  const result = validateRubricScores(criteria, { research: "2.25", impact: "7.5" });
  assert.deepEqual(Object.keys(result), ["errors", "scores"]);
  assert.equal(result.scores?.some((score) => "result" in score || "weighted" in score), false);
});
