import { fetchWithSession } from "@/features/auth/auth-service";

export type InstitutionalStudent = { id: string; fullName: string; email: string; cpf: string; registrationNumber: string; classCode?: string | null; className?: string | null; term?: string | null; status: string };
export type StudentPayload = { fullName: string; email: string; cpf: string; registrationNumber: string; classCode: string };
export type StudentImportResult = { total: number; imported: number; rejected: number; errors: string[] };

async function request<T>(path: string, init: RequestInit = {}) {
  const token = typeof window === "undefined" ? null : window.sessionStorage.getItem("plataforma.accessToken");
  const response = await fetchWithSession(`/api/v1${path}`, { ...init, headers: { Accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...init.headers } });
  if (!response.ok) throw new Error(response.status === 403 ? "Apenas a coordenação pode gerenciar alunos." : "Não foi possível concluir a operação.");
  return (await response.json()) as T;
}

export function listStudents(query = "") { return request<InstitutionalStudent[]>(`/coordination/students${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ""}`); }
export function createStudent(payload: StudentPayload) { return request<InstitutionalStudent>("/coordination/students", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }); }
export function updateStudentStatus(id: string, value: "active" | "inactive") { return request<void>(`/coordination/students/${id}/status?value=${value}`, { method: "PATCH" }); }
export function updateStudent(id: string, payload: StudentPayload) { return request<InstitutionalStudent>(`/coordination/students/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }); }
export function importStudents(file: File) { const body = new FormData(); body.append("file", file); return request<StudentImportResult>("/coordination/students/import", { method: "POST", body }); }
export async function exportStudents(query = "") {
  const token = typeof window === "undefined" ? null : window.sessionStorage.getItem("plataforma.accessToken");
  const response = await fetchWithSession(`/api/v1/coordination/students/export${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ""}`, { headers: { Accept: "text/csv", ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
  if (!response.ok) throw new Error("Não foi possível gerar o relatório CSV.");
  return response.blob();
}
