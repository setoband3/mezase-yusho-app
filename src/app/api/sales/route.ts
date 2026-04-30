import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getTodayInJst } from "@/lib/date";
import { getInputLockStatus } from "@/lib/input-lock";
import { readStore, writeStore } from "@/lib/store";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    staffId?: string;
    amount?: number;
  };

  const staffId = body.staffId ?? "";
  const amount = Number(body.amount);

  if (!staffId) {
    return NextResponse.json({ message: "担当者を選択してください。" }, { status: 400 });
  }
  if (!Number.isFinite(amount)) {
    return NextResponse.json(
      { message: "売上金額を正しく入力してください（マイナス可）。" },
      { status: 400 },
    );
  }

  const store = await readStore();
  const today = getTodayInJst();
  const lockStatus = getInputLockStatus(store, today);
  if (lockStatus.isLocked) {
    return NextResponse.json(
      {
        message: `入力ロック中です。${lockStatus.previousWorkingDay} が未入力の担当者: ${lockStatus.pendingStaffNames.join(" / ")}`,
      },
      { status: 423 },
    );
  }

  const targetStaff = store.staff.find((member) => member.id === staffId && member.active);
  if (!targetStaff) {
    return NextResponse.json(
      { message: "担当者が見つかりませんでした。" },
      { status: 404 },
    );
  }

  store.sales.push({
    id: randomUUID(),
    staffId,
    amount: Math.floor(amount),
    salesDate: today,
    createdAt: new Date().toISOString(),
  });
  await writeStore(store);

  return NextResponse.json({ ok: true });
}
