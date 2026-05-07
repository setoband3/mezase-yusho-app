import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getTodayInJst } from "@/lib/date";
import { getInputLockStatus } from "@/lib/input-lock";
import { readStore, writeStore } from "@/lib/store";

export async function POST() {
  const store = await readStore();
  const today = getTodayInJst();
  const lock = getInputLockStatus(store, today);

  if (!lock.isLocked || !lock.previousWorkingDay) {
    return NextResponse.json({
      ok: true,
      message: "現在、入力ロックはかかっていません。",
    });
  }

  const now = new Date().toISOString();
  const activeStaff = store.staff.filter((member) => member.active);
  const submittedSet = new Set(
    store.checkins
      .filter((checkin) => checkin.checkinDate === lock.previousWorkingDay)
      .map((checkin) => checkin.staffId),
  );

  const unlockedNames: string[] = [];
  activeStaff.forEach((staff) => {
    if (submittedSet.has(staff.id)) {
      return;
    }
    store.checkins.push({
      id: randomUUID(),
      staffId: staff.id,
      checkinDate: lock.previousWorkingDay as string,
      createdAt: now,
    });
    unlockedNames.push(staff.name);
  });

  if (unlockedNames.length > 0) {
    await writeStore(store);
  }

  return NextResponse.json({
    ok: true,
    message:
      unlockedNames.length > 0
        ? `入力ロックを解除しました（補完: ${unlockedNames.join(" / ")}）`
        : "入力ロックを解除しました。",
  });
}
