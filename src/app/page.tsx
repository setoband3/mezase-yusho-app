import { DashboardClient } from "./dashboard-client";
import type { DashboardData } from "./dashboard-types";
import { getTodayInJst } from "@/lib/date";
import { calculateDashboard } from "@/lib/metrics";
import { readStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function Home() {
  const store = await readStore();
  const today = getTodayInJst();
  const initialData = {
    today,
    ...calculateDashboard(store, today),
  } as DashboardData;

  return <DashboardClient initialData={initialData} />;
}
