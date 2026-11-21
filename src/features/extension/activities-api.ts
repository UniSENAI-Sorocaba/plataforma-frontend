import { expireSession } from "@/features/auth/session";

export type ActivityStatus = "SUBMITTED" | "APPROVED" | "REJECTED";
export type Activity = {
  id: string; projectId: string; periodId: string; studentId: string; title: string; description: string;
  requestedHours: number; approvedHours: number | null; status: ActivityStatus; rejectionReason: string | null;
  submittedAt: string; reviewedAt: string | null; reviewedBy: string | null; updatedAt: string;
};
export type HoursTotal = { projectId: string; periodId: string; studentId: string; approvedHours: number };

function token() { return typeof window === "undefined" ? null : window.sessionStorage.getItem("plataforma.accessToken"); }
async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api/v1${path}`, { ...init, headers: {
    Accept: "application/json", ...(init.body ? { "Content-Type": "application/json" } : {}),
    ...(token() ? { Authorization: `Bearer ${token()}` } : {}), ...init.headers,
  } });
  if (!response.ok) { if (response.status === 401) expireSession(); throw new Error(response.status === 403 ? "Você não tem permissão para esta operação." : "Não foi possível concluir a operação."); }
  return (await response.json()) as T;
}
export function listMine(projectId: string, periodId: string) { return request<Activity[]>(`/extension/projects/${projectId}/periods/${periodId}/activities/mine`); }
export function listProjectActivities(projectId: string, periodId: string) { return request<Activity[]>(`/extension/projects/${projectId}/periods/${periodId}/activities`); }
export function totalMine(projectId: string, periodId: string) { return request<HoursTotal>(`/extension/projects/${projectId}/periods/${periodId}/hours/mine`); }
export function submitActivity(projectId: string, periodId: string, payload: Pick<Activity, "title" | "description" | "requestedHours">) {
  return request<Activity>(`/extension/projects/${projectId}/periods/${periodId}/activities`, { method: "POST", body: JSON.stringify(payload) });
}
export function correctActivity(id: string, payload: Pick<Activity, "title" | "description" | "requestedHours">) {
  return request<Activity>(`/extension/activities/${id}`, { method: "PUT", body: JSON.stringify(payload) });
}
export function decideActivity(id: string, status: ActivityStatus, approvedHours: number | null, rejectionReason: string | null) {
  return request<Activity>(`/extension/activities/${id}/decision`, { method: "PATCH", body: JSON.stringify({ status, approvedHours, rejectionReason }) });
}
