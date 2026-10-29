import { FacultyDashboard } from "@/features/faculty/faculty-dashboard";
import { getFacultyHomeData } from "@/features/faculty/faculty-service";

export const dynamic = "force-dynamic";

export default async function FacultyHome() {
  const data = await getFacultyHomeData();
  return <FacultyDashboard initialData={data} />;
}
