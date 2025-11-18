import { getDashboardData } from "./actions";
import DashboardClient from "./DashboardClient";

export const runtime = 'nodejs';
export const revalidate = 0;

export default async function Dashboard() {
  const data = await getDashboardData();

  return <DashboardClient data={data} />;
}
