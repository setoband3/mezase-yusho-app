import type { AppStore, CheckinLog, SaleLog, Staff } from "./types";
import { getSupabaseAdmin } from "./supabase-admin";

const GOAL_ROW_ID = 1;

type GoalRow = {
  id: number;
  total_target_amount: number;
  start_date: string;
  end_date: string;
  holiday_dates: string[];
};

function normalizeDate(value: string | Date) {
  if (typeof value === "string") {
    return value.slice(0, 10);
  }
  return value.toISOString().slice(0, 10);
}

export async function readStoreFromSupabase(): Promise<AppStore> {
  const supabase = getSupabaseAdmin();

  const [staffRes, goalRes, salesRes, checkinsRes] = await Promise.all([
    supabase.from("staff").select("id,name,active"),
    supabase
      .from("goal_settings")
      .select("id,total_target_amount,start_date,end_date,holiday_dates")
      .eq("id", GOAL_ROW_ID)
      .maybeSingle<GoalRow>(),
    supabase
      .from("sales")
      .select("id,staff_id,amount,sales_date,created_at")
      .order("created_at", { ascending: true }),
    supabase
      .from("checkins")
      .select("id,staff_id,checkin_date,created_at")
      .order("created_at", { ascending: true }),
  ]);

  if (staffRes.error) throw staffRes.error;
  if (goalRes.error) throw goalRes.error;
  if (salesRes.error) throw salesRes.error;
  if (checkinsRes.error) throw checkinsRes.error;

  const staff: Staff[] = (staffRes.data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    active: Boolean(row.active),
  }));

  const sales: SaleLog[] = (salesRes.data ?? []).map((row) => ({
    id: row.id,
    staffId: row.staff_id,
    amount: Number(row.amount),
    salesDate: normalizeDate(row.sales_date),
    createdAt: row.created_at,
  }));

  const checkins: CheckinLog[] = (checkinsRes.data ?? []).map((row) => ({
    id: row.id,
    staffId: row.staff_id,
    checkinDate: normalizeDate(row.checkin_date),
    createdAt: row.created_at,
  }));

  return {
    staff,
    sales,
    checkins,
    goal: {
      totalTargetAmount: goalRes.data?.total_target_amount ?? 0,
      startDate: goalRes.data?.start_date ?? "2026-04-01",
      endDate: goalRes.data?.end_date ?? "2026-04-30",
      holidayDates: (goalRes.data?.holiday_dates ?? []).map(normalizeDate),
    },
  };
}

export async function writeStoreToSupabase(next: AppStore): Promise<void> {
  const supabase = getSupabaseAdmin();

  const goalUpsert = supabase.from("goal_settings").upsert(
    {
      id: GOAL_ROW_ID,
      total_target_amount: next.goal.totalTargetAmount,
      start_date: next.goal.startDate,
      end_date: next.goal.endDate,
      holiday_dates: next.goal.holidayDates,
    },
    { onConflict: "id" },
  );

  const goalRes = await goalUpsert;
  if (goalRes.error) throw goalRes.error;

  const clearSalesRes = await supabase
    .from("sales")
    .delete()
    .not("id", "is", null);
  if (clearSalesRes.error) throw clearSalesRes.error;

  const clearCheckinsRes = await supabase
    .from("checkins")
    .delete()
    .not("id", "is", null);
  if (clearCheckinsRes.error) throw clearCheckinsRes.error;

  const clearStaffRes = await supabase
    .from("staff")
    .delete()
    .not("id", "is", null);
  if (clearStaffRes.error) throw clearStaffRes.error;

  if (next.staff.length > 0) {
    const insertStaffRes = await supabase.from("staff").insert(
      next.staff.map((member) => ({
        id: member.id,
        name: member.name,
        active: member.active,
      })),
    );
    if (insertStaffRes.error) throw insertStaffRes.error;
  }

  if (next.sales.length > 0) {
    const insertSalesRes = await supabase.from("sales").insert(
      next.sales.map((sale) => ({
        id: sale.id,
        staff_id: sale.staffId,
        amount: sale.amount,
        sales_date: sale.salesDate,
        created_at: sale.createdAt,
      })),
    );
    if (insertSalesRes.error) throw insertSalesRes.error;
  }

  if (next.checkins.length > 0) {
    const insertCheckinsRes = await supabase.from("checkins").insert(
      next.checkins.map((checkin) => ({
        id: checkin.id,
        staff_id: checkin.staffId,
        checkin_date: checkin.checkinDate,
        created_at: checkin.createdAt,
      })),
    );
    if (insertCheckinsRes.error) throw insertCheckinsRes.error;
  }
}
