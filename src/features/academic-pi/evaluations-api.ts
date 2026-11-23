import { fetchWithSession } from "@/features/auth/auth-service";

export type Evaluation = {
  id: string;
  projectId: string;
  periodId: string;
  projectTitle?: string | null;
  academicTerm?: string | null;
  evaluatedStudentId: string;
  evaluationDate: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  evaluatorIds: string[];
  evaluatedStudentName?: string | null;
  evaluatedStudentEmail?: string | null;
  evaluatorDetails?: Array<{ id: string; fullName: string; email: string; role: string }>;
  rubricVersionId?: string | null;
  finalScore?: number | null;
};
export type CoordinationEvaluation = { id: string; projectTitle: string; academicTerm: string; studentName: string; evaluationDate: string; evaluatorNames: string; finalScore: number | null };

export type Rubric = {
  id: string;
  code: string;
  name: string;
  versionId: string;
  version: number;
  criteria: Array<{ id: string; code: string; label: string; weight: number; minScore: number; maxScore: number }>;
};

export type ProjectParticipant = { projectId: string; periodId: string; studentId: string; status: string; joinedAt: string; studentName?: string | null; studentEmail?: string | null };
export type InstitutionalDirectoryEntry = { id: string; fullName: string; email: string; role: "DOCENTE" | "COORDENACAO" };

function accessToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem("plataforma.accessToken");
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = accessToken();
  const response = await fetchWithSession(`/api/v1${path}`, {
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

export function listAssignedEvaluations(): Promise<Evaluation[]> {
  return request("/evaluations/assigned");
}

export function listStudentEvaluations(): Promise<Evaluation[]> {
  return request("/evaluations/student");
}

export function listCoordinationEvaluations(): Promise<CoordinationEvaluation[]> {
  return request("/evaluations/coordination");
}

export function listProjectParticipants(projectId: string, periodId: string): Promise<ProjectParticipant[]> {
  return request(`/projects/${projectId}/periods/${periodId}/participants`);
}

export function listInstitutionalDirectory(query = ""): Promise<InstitutionalDirectoryEntry[]> {
  const params = query.trim() ? `?role=DOCENTE&q=${encodeURIComponent(query.trim())}` : "?role=DOCENTE";
  return request(`/institutional/directory${params}`);
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
  return request(`/rubrics/${rubricId}/versions/${version}`);
}

export function getDefaultRubric(): Promise<Rubric> {
  return request("/rubrics/default");
}

export function gradeEvaluation(projectId: string, periodId: string, evaluationId: string, payload: { rubricVersionId: string; scores: Array<{ criterionCode: string; score: number }> }): Promise<{ evaluationId: string; rubricVersionId: string; finalScore: number }> {
  return request(`/projects/${projectId}/periods/${periodId}/evaluations/${evaluationId}/grade`, { method: "POST", body: JSON.stringify(payload) });
}
