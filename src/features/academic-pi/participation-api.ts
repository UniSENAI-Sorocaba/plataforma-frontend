import type { ParticipationRequestStatus } from "./participation-types";
import type { Project } from "./projects-api";
import { expireSession } from "@/features/auth/session";
import { fetchWithSession } from "@/features/auth/auth-service";

export type ParticipationRequest = {
  id: string;
  projectId: string;
  periodId: string;
  studentId: string;
  status: ParticipationRequestStatus;
  requestedAt: string;
  decidedAt: string | null;
  decisionReason: string | null;
  studentName?: string | null;
  studentEmail?: string | null;
  academicTerm?: string | null;
};

export type EnrollmentPeriod = {
  id: string;
  projectId: string;
  academicTerm: string;
  startsAt: string;
  endsAt: string;
  createdAt: string;
  updatedAt: string;
};

export type Deliverable = {
  id: string;
  projectId: string;
  periodId: string;
  ownerId: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  sha256: string | null;
  version: number;
  status: "PENDING_UPLOAD" | "AVAILABLE" | "CANCELLED" | "EXPIRED";
  uploadExpiresAt: string;
  uploadUrl: string | null;
  downloadUrl: string | null;
};

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
    try { const body = (await response.json()) as { detail?: string; message?: string }; detail = body.message ?? body.detail ?? detail; } catch { /* API sem corpo JSON. */ }
    if (response.status === 401) { expireSession(); detail = "Sua sessão expirou. Entre novamente para continuar."; }
    if (response.status === 403) detail = "Você não tem permissão para esta operação.";
    throw new Error(detail);
  }
  return response.status === 204 ? undefined as T : (await response.json()) as T;
}

export function requestParticipation(projectId: string): Promise<ParticipationRequest> { return request(`/projects/${projectId}/participation-requests`, { method: "POST" }); }
export function listOwnParticipationRequests(): Promise<ParticipationRequest[]> { return request("/participation-requests/mine"); }
export function withdrawParticipation(requestId: string): Promise<ParticipationRequest> { return request(`/participation-requests/${requestId}/withdraw`, { method: "POST" }); }
export function listManagedProjects(): Promise<Project[]> { return request<Project[]>("/projects/managed"); }
export function listProjectPeriods(projectId: string): Promise<EnrollmentPeriod[]> { return request<EnrollmentPeriod[]>(`/projects/${projectId}/enrollment-periods`); }
export function listProjectParticipationRequests(projectId: string): Promise<ParticipationRequest[]> { return request<ParticipationRequest[]>(`/projects/${projectId}/participation-requests`); }
export function decideParticipation(requestId: string, status: "APPROVED" | "REJECTED"): Promise<ParticipationRequest> {
  return request<ParticipationRequest>(`/participation-requests/${requestId}`, { method: "PATCH", body: JSON.stringify({ status: status === "REJECTED" ? "DENIED" : status }) });
}

export function initiateDeliverableUpload(projectId: string, periodId: string, file: File): Promise<Deliverable> {
  return request<Deliverable>(`/projects/${projectId}/periods/${periodId}/deliverables`, {
    method: "POST",
    body: JSON.stringify({ fileName: file.name, contentType: file.type, sizeBytes: file.size }),
  });
}

export async function uploadDeliverable(upload: Deliverable, file: File, signal: AbortSignal): Promise<Deliverable> {
  if (!upload.uploadUrl) throw new Error("A URL de upload não foi emitida.");
  const response = await fetch(upload.uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file, signal });
  if (!response.ok) throw new Error("Não foi possível armazenar o arquivo.");
  return (await response.json()) as Deliverable;
}
