import type { AppStore, Staff } from "./types";
import { getInputLockStatus } from "./input-lock";
import { listWorkingDays } from "./workdays";

const TEN_THOUSAND = 10000;

function ceilToTenThousand(value: number): number {
  if (value <= 0) {
    return 0;
  }
  return Math.ceil(value / TEN_THOUSAND) * TEN_THOUSAND;
}

function sumSalesByDateAndStaff(store: AppStore, date: string, staffId: string): number {
  return store.sales
    .filter((sale) => sale.salesDate === date && sale.staffId === staffId)
    .reduce((acc, sale) => acc + sale.amount, 0);
}

function sumSalesByDate(store: AppStore, date: string): number {
  return store.sales
    .filter((sale) => sale.salesDate === date)
    .reduce((acc, sale) => acc + sale.amount, 0);
}

function sumAllSales(store: AppStore): number {
  return store.sales.reduce((acc, sale) => acc + sale.amount, 0);
}

function sumSalesBeforeDate(store: AppStore, date: string): number {
  return store.sales
    .filter((sale) => sale.salesDate < date)
    .reduce((acc, sale) => acc + sale.amount, 0);
}

function calculateAchieveStreak(
  store: AppStore,
  workingDays: string[],
  today: string,
  staffId: string,
  perDayTarget: number,
): number {
  if (perDayTarget <= 0) {
    return 0;
  }
  const daysUntilToday = workingDays.filter((day) => day <= today).reverse();
  let streak = 0;
  for (const day of daysUntilToday) {
    const sales = sumSalesByDateAndStaff(store, day, staffId);
    if (sales >= perDayTarget) {
      streak += 1;
      continue;
    }
    break;
  }
  return streak;
}

export function calculateDailyTargets(store: AppStore) {
  const activeStaff = store.staff.filter((member) => member.active);
  const staffCount = activeStaff.length;
  const allWorkingDays = listWorkingDays(
    store.goal.startDate,
    store.goal.endDate,
    store.goal.holidayDates,
  );

  return {
    activeStaff,
    staffCount,
    allWorkingDays,
  };
}

export function calculateDashboard(store: AppStore, date: string) {
  const { activeStaff, staffCount, allWorkingDays } = calculateDailyTargets(store);

  const todayTeamSales = sumSalesByDate(store, date);
  const totalSales = sumAllSales(store);
  const totalTarget = store.goal.totalTargetAmount;
  const salesBeforeToday = sumSalesBeforeDate(store, date);
  // 日割り目標の分母は「昨日までの売上」まで（当日入力で日中に目標が動かない）
  const remainingForDailySplit = Math.max(totalTarget - salesBeforeToday, 0);
  const remainingTarget = Math.max(totalTarget - totalSales, 0);
  const totalWorkDays = allWorkingDays.length;
  const remainingWorkDays = Math.max(
    allWorkingDays.filter((day) => day >= date).length,
    1,
  );
  const perDayTeamTarget = Math.ceil(remainingForDailySplit / remainingWorkDays);
  const perDayPerStaffTarget = ceilToTenThousand(
    perDayTeamTarget / Math.max(staffCount, 1),
  );

  const staffRows = activeStaff.map((member: Staff) => {
    const todaySales = sumSalesByDateAndStaff(store, date, member.id);
    const dailyRate =
      perDayPerStaffTarget > 0 ? (todaySales / perDayPerStaffTarget) * 100 : 0;
    const streakDays = calculateAchieveStreak(
      store,
      allWorkingDays,
      date,
      member.id,
      perDayPerStaffTarget,
    );
    return {
      id: member.id,
      name: member.name,
      todaySales,
      dailyTarget: perDayPerStaffTarget,
      dailyRate,
      streakDays,
      remainingForToday: Math.max(perDayPerStaffTarget - todaySales, 0),
    };
  });

  const inputLock = getInputLockStatus(store, date);

  return {
    goal: store.goal,
    staffCount,
    totalWorkDays,
    remainingWorkDays,
    remainingTarget,
    perDayTeamTarget,
    perDayPerStaffTarget,
    todayTeamSales,
    todayTeamRate: perDayTeamTarget > 0 ? (todayTeamSales / perDayTeamTarget) * 100 : 0,
    todayTeamRemaining: Math.max(perDayTeamTarget - todayTeamSales, 0),
    totalSales,
    totalRate: totalTarget > 0 ? (totalSales / totalTarget) * 100 : 0,
    totalRemaining: remainingTarget,
    inputLock,
    staffRows,
    notInputStaff: activeStaff
      .filter(
        (member) =>
          !store.checkins.some(
            (checkin) =>
              checkin.staffId === member.id && checkin.checkinDate === date,
          ),
      )
      .map((member) => member.name),
    recentSales: store.sales
      .filter((sale) => sale.salesDate === date)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .slice(0, 20),
  };
}
