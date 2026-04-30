import { promises as fs } from "node:fs";
import path from "node:path";
import { isSupabaseEnabled } from "./supabase-admin";
import { readStoreFromSupabase, writeStoreToSupabase } from "./supabase-store";
import type { AppStore } from "./types";

const storePath = path.join(process.cwd(), "data", "store.json");

const defaultStore: AppStore = {
  staff: [],
  goal: {
    totalTargetAmount: 0,
    startDate: "2026-04-01",
    endDate: "2026-04-30",
    holidayDates: [],
  },
  sales: [],
  checkins: [],
};

async function ensureStoreFile() {
  const dir = path.dirname(storePath);
  await fs.mkdir(dir, { recursive: true });
  try {
    await fs.access(storePath);
  } catch {
    await fs.writeFile(storePath, JSON.stringify(defaultStore, null, 2), "utf8");
  }
}

export async function readStore(): Promise<AppStore> {
  if (isSupabaseEnabled()) {
    return readStoreFromSupabase();
  }
  await ensureStoreFile();
  const raw = await fs.readFile(storePath, "utf8");
  const parsed = JSON.parse(raw) as Partial<AppStore>;

  return {
    staff: parsed.staff ?? [],
    sales: parsed.sales ?? [],
    checkins: parsed.checkins ?? [],
    goal: {
      totalTargetAmount: parsed.goal?.totalTargetAmount ?? 0,
      startDate: parsed.goal?.startDate ?? defaultStore.goal.startDate,
      endDate: parsed.goal?.endDate ?? defaultStore.goal.endDate,
      holidayDates: parsed.goal?.holidayDates ?? [],
    },
  };
}

export async function writeStore(next: AppStore): Promise<void> {
  if (isSupabaseEnabled()) {
    await writeStoreToSupabase(next);
    return;
  }
  await ensureStoreFile();
  await fs.writeFile(storePath, JSON.stringify(next, null, 2), "utf8");
}
