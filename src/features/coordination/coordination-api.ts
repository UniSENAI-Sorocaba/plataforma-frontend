import { fetchWithSession } from "@/features/auth/auth-service";
import type { Project } from "@/features/academic-pi/projects-api";

export type ManagedOpportunity = { id: string; projectId: string | null; title: string; description: string; status: "DRAFT" | "PUBLISHED" | "CLOSED"; startsAt: string; endsAt: string; createdAt: string; updatedAt: string };
export type ProjectPayload = { title: string; summary: string; description: string; classification: "PI" | "EXTENSION" | "BOTH"; continuity: "CONTINUOUS" | "FIXED_END"; endDate: string | null; publicationStatus: "DRAFT" | "PUBLISHED"; responsibleTeacherIds: string[] };
export type OpportunityPayload = { projectId: string | null; title: string; description: string; startsAt: string; endsAt: string };

function token() { return typeof window === "undefined" ? null : window.sessionStorage.getItem("plataforma.accessToken"); }
async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetchWithSession(`/api/v1${path}`, { ...init, headers: { Accept: "application/json", ...(init.body ? { "Content-Type": "application/json" } : {}), ...(token() ? { Authorization: `Bearer ${token()}` } : {}), ...init.headers } });
  if (!response.ok) { let message = "Não foi possível concluir a operação."; try { const body = await response.json() as { detail?: string; message?: string }; message = body.detail ?? body.message ?? message; } catch { /* resposta sem JSON */ } throw new Error(message); }
  return response.status === 204 ? undefined as T : await response.json() as T;
}
export const listCoordinationProjects = () => request<Project[]>("/coordination/projects");
export const createProject = (payload: ProjectPayload) => request<Project>("/projects", { method: "POST", body: JSON.stringify(payload) });
export const updateProject = (id: string, payload: ProjectPayload) => request<Project>(`/coordination/projects/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
export const archiveProject = (id: string) => request<void>(`/coordination/projects/${id}`, { method: "DELETE" });
export const listManagedOpportunities = () => request<ManagedOpportunity[]>("/extension/opportunities/manage");
export const createOpportunity = (payload: OpportunityPayload) => request<ManagedOpportunity>("/extension/opportunities", { method: "POST", body: JSON.stringify(payload) });
export const updateOpportunity = (id: string, payload: OpportunityPayload) => request<ManagedOpportunity>(`/extension/opportunities/${id}`, { method: "PUT", body: JSON.stringify(payload) });
export const deleteOpportunity = (id: string) => request<void>(`/extension/opportunities/${id}`, { method: "DELETE" });
export const publishOpportunity = (id: string) => request<ManagedOpportunity>(`/extension/opportunities/${id}/publish`, { method: "PATCH" });
export const closeOpportunity = (id: string) => request<ManagedOpportunity>(`/extension/opportunities/${id}/close`, { method: "PATCH" });
