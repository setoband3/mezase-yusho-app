import { NextRequest, NextResponse } from "next/server";
import { readStore, writeStore } from "@/lib/store";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { clearHolidayDates?: boolean };
  const clearHolidayDates = Boolean(body.clearHolidayDates);

  const store = await readStore();
  store.sales = [];
  store.checkins = [];
  store.goal.totalTargetAmount = 0;
  if (clearHolidayDates) {
    store.goal.holidayDates = [];
  }

  await writeStore(store);
  return NextResponse.json({ ok: true });
}
