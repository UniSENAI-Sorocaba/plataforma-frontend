/**
 * Validates score input against the bounds supplied by the rubric contract.
 * This function deliberately does not calculate a weighted result.
 *
 * @param {Array<{id: string, minimum: number, maximum: number}>} criteria
 * @param {Record<string, string>} values
 * @returns {{ errors: Record<string, string>, scores: Array<{criterionId: string, value: number}> | null }}
 */
export function validateRubricScores(criteria, values) {
  const errors = {};
  if (!Array.isArray(criteria) || criteria.length === 0) {
    return { errors: { _form: "A rubrica não possui critérios para avaliar." }, scores: null };
  }

  const ids = criteria.map((criterion) => criterion.id);
  if (ids.some((id) => !id) || new Set(ids).size !== ids.length) {
    return { errors: { _form: "A rubrica recebida é inválida." }, scores: null };
  }

  const scores = [];
  for (const criterion of criteria) {
    if (
      !Number.isFinite(criterion.minimum)
      || !Number.isFinite(criterion.maximum)
      || criterion.minimum > criterion.maximum
    ) {
      errors[criterion.id] = "Os limites deste critério são inválidos.";
      continue;
    }

    const rawValue = values[criterion.id]?.trim();
    if (!rawValue) {
      errors[criterion.id] = "Preencha a nota deste critério.";
      continue;
    }

    const value = Number(rawValue);
    if (!Number.isFinite(value)) {
      errors[criterion.id] = "Informe um número válido.";
      continue;
    }
    if (value < criterion.minimum || value > criterion.maximum) {
      errors[criterion.id] = `Informe um valor entre ${criterion.minimum} e ${criterion.maximum}.`;
      continue;
    }

    scores.push({ criterionId: criterion.id, value });
  }

  return {
    errors,
    scores: Object.keys(errors).length === 0 ? scores : null,
  };
}
