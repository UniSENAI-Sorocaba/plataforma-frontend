export type PublicImpact = {
  id: string;
  projectId: string;
  title: string;
  status: "APPROVED";
  version: number;
  summary: string;
  evidenceUrl: string | null;
  updatedAt: string;
};

export async function listPublicImpacts(): Promise<PublicImpact[]> {
  const baseUrl = process.env.BACKEND_URL ?? "http://localhost:8080";
  try {
    const response = await fetch(`${baseUrl}/api/v1/public/impacts`, { headers: { Accept: "application/json" }, next: { revalidate: 60 } });
    if (!response.ok) return [];
    return (await response.json()) as PublicImpact[];
  } catch { return []; }
}
