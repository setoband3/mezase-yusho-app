import { NextRequest, NextResponse } from "next/server";
import { readStore, writeStore } from "@/lib/store";
import { isValidYmd, listWorkingDays } from "@/lib/workdays";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    totalTargetAmount?: number;
    startDate?: string;
    endDate?: string;
    holidayDates?: string[];
  };

  const totalTargetAmount = Number(body.totalTargetAmount);
  const startDate = String(body.startDate ?? "");
  const endDate = String(body.endDate ?? "");
  const holidayDates = Array.isArray(body.holidayDates)
    ? body.holidayDates.map((day) => String(day))
    : [];

  if (!Number.isFinite(totalTargetAmount) || totalTargetAmount < 0) {
    return NextResponse.json(
      { message: "全体目標金額は0以上で入力してください。" },
      { status: 400 },
    );
  }
  if (!isValidYmd(startDate) || !isValidYmd(endDate)) {
    return NextResponse.json(
      { message: "開始日と終了日を正しい形式で入力してください。" },
      { status: 400 },
    );
  }
  if (startDate > endDate) {
    return NextResponse.json(
      { message: "終了日は開始日以降を指定してください。" },
      { status: 400 },
    );
  }
  if (holidayDates.some((day) => !isValidYmd(day))) {
    return NextResponse.json(
      { message: "休業日に不正な日付形式があります。" },
      { status: 400 },
    );
  }

  const workingDays = listWorkingDays(startDate, endDate, holidayDates);
  if (workingDays.length < 1) {
    return NextResponse.json(
      { message: "稼働日が0日です。期間または休業日を見直してください。" },
      { status: 400 },
    );
  }

  const store = await readStore();
  store.goal = {
    totalTargetAmount,
    startDate,
    endDate,
    holidayDates,
  };
  await writeStore(store);

  return NextResponse.json({ ok: true });
}
