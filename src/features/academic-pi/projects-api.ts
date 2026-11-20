export type Project = {
  id: string;
  title: string;
  summary: string | null;
  description: string | null;
  classification: "PI" | "EXTENSION" | "BOTH";
  continuity: "CONTINUOUS" | "FIXED_END";
  endDate: string | null;
  publicationStatus: "DRAFT" | "PUBLISHED";
  lifecycleStatus: "ACTIVE" | "ARCHIVED";
  responsibleTeacherIds: string[];
  createdAt: string;
  updatedAt: string;
};

export async function listPublicProjects(): Promise<Project[]> {
  const baseUrl = process.env.BACKEND_URL ?? "http://localhost:8080";
  try {
    const response = await fetch(`${baseUrl}/api/v1/public/projects`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 30 },
    });
    if (!response.ok) return [];
    return (await response.json()) as Project[];
  } catch {
    return [];
  }
}

export function classificationLabel(classification: Project["classification"]): string {
  return classification === "PI" ? "Projeto integrador" : classification === "EXTENSION" ? "Extensão" : "PI e extensão";
}
