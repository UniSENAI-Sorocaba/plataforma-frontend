import type { ParticipationRequestStatus } from "./participation-types";

export type ParticipationRequest = {
  id: string;
  projectId: string;
  periodId: string;
  studentId: string;
  status: ParticipationRequestStatus;
  submittedAt: string;
  decidedAt: string | null;
  decisionReason: string | null;
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
    try { detail = ((await response.json()) as { detail?: string }).detail ?? detail; } catch { /* API sem corpo JSON. */ }
    if (response.status === 401) detail = "Sua sessão expirou. Entre novamente para continuar.";
    if (response.status === 403) detail = "Você não tem permissão para esta operação.";
    throw new Error(detail);
  }
  return response.status === 204 ? undefined as T : (await response.json()) as T;
}

export function requestParticipation(projectId: string): Promise<ParticipationRequest> { return request(`/projects/${projectId}/participation-requests`, { method: "POST" }); }
export function listOwnParticipationRequests(): Promise<ParticipationRequest[]> { return request("/participation-requests/mine"); }
export function withdrawParticipation(requestId: string): Promise<ParticipationRequest> { return request(`/participation-requests/${requestId}/withdraw`, { method: "POST" }); }
