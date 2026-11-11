import type { Metadata } from "next";
import { AdminDashboard } from "@/features/admin/admin-dashboard";
import { getAdminDashboardData } from "@/features/admin/admin-service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Painel do Administrador | UniSENAI Sorocaba",
  description: "Ambiente do Administrador da Plataforma - Gestão de usuários, RBAC e infraestrutura.",
};

export default async function AdminPage() {
  const data = await getAdminDashboardData();

  return <AdminDashboard initialData={data} />;
}
