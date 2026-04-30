import { NextResponse } from "next/server";
import { getTodayInJst } from "@/lib/date";
import { calculateDashboard } from "@/lib/metrics";
import { readStore } from "@/lib/store";

export async function GET() {
  const store = await readStore();
  const today = getTodayInJst();
  return NextResponse.json({
    today,
    ...calculateDashboard(store, today),
  });
}
