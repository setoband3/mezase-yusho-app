import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { readStore, writeStore } from "@/lib/store";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { name?: string };
  const name = (body.name ?? "").trim();
  if (!name) {
    return NextResponse.json(
      { message: "担当者名を入力してください。" },
      { status: 400 },
    );
  }

  const store = await readStore();
  const exists = store.staff.some((member) => member.name === name && member.active);
  if (exists) {
    return NextResponse.json(
      { message: "同じ名前の担当者がすでに存在します。" },
      { status: 400 },
    );
  }

  store.staff.push({
    id: randomUUID(),
    name,
    active: true,
  });
  await writeStore(store);

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const body = (await request.json()) as { staffId?: string };
  const staffId = body.staffId ?? "";
  if (!staffId) {
    return NextResponse.json({ message: "削除対象が指定されていません。" }, { status: 400 });
  }

  const store = await readStore();
  const target = store.staff.find((member) => member.id === staffId && member.active);
  if (!target) {
    return NextResponse.json({ message: "担当者が見つかりませんでした。" }, { status: 404 });
  }

  target.active = false;
  await writeStore(store);
  return NextResponse.json({ ok: true });
}
