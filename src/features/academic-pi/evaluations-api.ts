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
