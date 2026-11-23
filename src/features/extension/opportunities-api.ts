import { expireSession } from "@/features/auth/session";
import { fetchWithSession } from "@/features/auth/auth-service";

export type ExtensionOpportunity = {
  id: string;
  projectId: string | null;
  title: string;
  description: string;
  status: "DRAFT" | "PUBLISHED" | "CLOSED";
  startsAt: string;
  endsAt: string;
  createdAt: string;
  updatedAt: string;
};

export type ExtensionApplication = {
  id: string;
  opportunityId: string;
  studentId: string;
  status: "SUBMITTED" | "WITHDRAWN";
  submittedAt: string;
  withdrawnAt: string | null;
};

function accessToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem("plataforma.accessToken");
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = accessToken();
  const response = await fetchWithSession(`/api/v1${path}`, {
    ...init,
    headers: { Accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...init.headers },
  });
  if (!response.ok) { let detail = response.status === 401 ? "Sua sessão expirou. Entre novamente." : "Não foi possível concluir a operação."; try { const body = (await response.json()) as { message?: string; detail?: string }; detail = body.message ?? body.detail ?? detail; } catch { /* API sem corpo JSON. */ } if (response.status === 401) expireSession(); throw new Error(detail); }
  return (await response.json()) as T;
}

export async function listExtensionOpportunities(): Promise<ExtensionOpportunity[]> {
  if (typeof window !== "undefined") return request<ExtensionOpportunity[]>("/extension/opportunities");
  const baseUrl = process.env.BACKEND_URL ?? "http://localhost:8080";
  try {
    const response = await fetch(`${baseUrl}/api/v1/extension/opportunities`, { headers: { Accept: "application/json" }, next: { revalidate: 30 } });
    if (!response.ok) return [];
    return (await response.json()) as ExtensionOpportunity[];
  } catch { return []; }
}

export async function applyToExtensionOpportunity(id: string): Promise<ExtensionApplication> {
  return request<ExtensionApplication>(`/extension/opportunities/${id}/applications`, { method: "POST" });
}

export async function listOwnExtensionApplications(): Promise<ExtensionApplication[]> {
  return request<ExtensionApplication[]>("/extension/applications/mine");
}
