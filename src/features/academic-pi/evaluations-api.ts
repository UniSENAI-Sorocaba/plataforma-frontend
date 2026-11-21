export type Evaluation = {
  id: string;
  projectId: string;
  periodId: string;
  evaluatedStudentId: string;
  evaluationDate: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  evaluatorIds: string[];
  rubricVersionId?: string | null;
  finalScore?: number | null;
};

export type Rubric = {
  id: string;
  code: string;
  name: string;
  versionId: string;
  version: number;
  criteria: Array<{ id: string; code: string; label: string; weight: number; minScore: number; maxScore: number }>;
};

function accessToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem("plataforma.accessToken");
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = accessToken();
  const response = await fetch(`/api/v1${path}`, {
    ...init,
    headers: { Accept: "application/json", ...(init.body ? { "Content-Type": "application/json" } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}), ...init.headers },
  });
  if (!response.ok) {
    let detail = "Não foi possível concluir a operação.";
    try {
      const body = (await response.json()) as { message?: string; detail?: string };
      detail = body.message ?? body.detail ?? detail;
    } catch { /* resposta sem corpo JSON */ }
    if (response.status === 403) detail = "Apenas a coordenação pode atribuir avaliadores.";
    throw new Error(detail);
  }
  return (await response.json()) as T;
}

export function listEvaluations(projectId: string, periodId: string): Promise<Evaluation[]> {
  return request(`/projects/${projectId}/periods/${periodId}/evaluations`);
}

export function createEvaluation(projectId: string, periodId: string, payload: {
  evaluatedStudentId: string;
  evaluationDate: string;
  evaluatorIds: string[];
}): Promise<Evaluation> {
  return request(`/projects/${projectId}/periods/${periodId}/evaluations`, { method: "POST", body: JSON.stringify(payload) });
}

export function createRubric(payload: { code: string; name: string; criteria: Array<{ code: string; label: string; weight: number; minScore?: number; maxScore?: number }> }): Promise<Rubric> {
  return request("/rubrics", { method: "POST", body: JSON.stringify(payload) });
}

export function getRubric(rubricId: string, version = 1): Promise<Rubric> {
  return request(`/rubrics/${rubricId}?version=${version}`);
}

export function gradeEvaluation(evaluationId: string, payload: { rubricVersionId: string; scores: Array<{ criterionCode: string; score: number }> }): Promise<{ evaluationId: string; rubricVersionId: string; finalScore: number }> {
  return request(`/evaluations/${evaluationId}/grade`, { method: "POST", body: JSON.stringify(payload) });
}
