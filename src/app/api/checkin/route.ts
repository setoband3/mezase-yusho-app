import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getTodayInJst } from "@/lib/date";
import { readStore, writeStore } from "@/lib/store";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { staffId?: string };
  const staffId = body.staffId ?? "";
  if (!staffId) {
    return NextResponse.json({ message: "担当者を選択してください。" }, { status: 400 });
  }

  const store = await readStore();
  const targetStaff = store.staff.find((member) => member.id === staffId && member.active);
  if (!targetStaff) {
    return NextResponse.json({ message: "担当者が見つかりません。" }, { status: 404 });
  }

  const today = getTodayInJst();
  const already = store.checkins.some(
    (checkin) => checkin.staffId === staffId && checkin.checkinDate === today,
  );
  if (!already) {
    store.checkins.push({
      id: randomUUID(),
      staffId,
      checkinDate: today,
      createdAt: new Date().toISOString(),
    });
    await writeStore(store);
  }

  return NextResponse.json({ ok: true });
}
