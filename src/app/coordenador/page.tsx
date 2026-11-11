import type { Metadata } from "next";
import { CoordinatorDashboard } from "@/features/coordinator/coordinator-dashboard";
import { getCoordinatorDashboardData } from "@/features/coordinator/coordinator-service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Painel da Coordenação | UniSENAI Sorocaba",
  description: "Ambiente do Coordenador de Curso - Gestão acadêmica e Projetos Integradores.",
};

export default async function CoordenadorPage() {
  const data = await getCoordinatorDashboardData();

  return <CoordinatorDashboard initialData={data} />;
}
