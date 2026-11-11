export type RubricCriterionBounds = {
  id: string;
  minimum: number;
  maximum: number;
};

export type RubricScoreValue = {
  criterionId: string;
  value: number;
};

export function validateRubricScores(
  criteria: RubricCriterionBounds[],
  values: Record<string, string>,
): {
  errors: Record<string, string>;
  scores: RubricScoreValue[] | null;
};
