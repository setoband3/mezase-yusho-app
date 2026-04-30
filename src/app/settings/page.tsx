import { getTodayInJst } from "@/lib/date";
import { calculateDashboard } from "@/lib/metrics";
import { readStore } from "@/lib/store";
import type { DashboardData } from "../dashboard-types";
import { SettingsClient } from "./settings-client";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const store = await readStore();
  const today = getTodayInJst();
  const initialData = {
    today,
    ...calculateDashboard(store, today),
  } as DashboardData;

  return <SettingsClient initialData={initialData} />;
}
