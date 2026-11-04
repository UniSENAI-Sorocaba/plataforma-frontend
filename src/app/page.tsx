import { StudentDashboard } from "@/features/student/student-dashboard";
import { getStudentHomeData } from "@/features/student/student-service";

export const dynamic = "force-dynamic";

export default async function Home() {
  const data = await getStudentHomeData();
  return <StudentDashboard data={data} />;
}
