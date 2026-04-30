export type DashboardData = {
  today: string;
  goal: {
    totalTargetAmount: number;
    startDate: string;
    endDate: string;
    holidayDates: string[];
  };
  staffCount: number;
  totalWorkDays: number;
  remainingWorkDays: number;
  remainingTarget: number;
  perDayTeamTarget: number;
  perDayPerStaffTarget: number;
  todayTeamSales: number;
  todayTeamRate: number;
  todayTeamRemaining: number;
  totalSales: number;
  totalRate: number;
  totalRemaining: number;
  inputLock: {
    isLocked: boolean;
    pendingStaffNames: string[];
    previousWorkingDay: string | null;
  };
  staffRows: {
    id: string;
    name: string;
    todaySales: number;
    dailyTarget: number;
    dailyRate: number;
    streakDays: number;
    remainingForToday: number;
  }[];
  recentSales: {
    id: string;
    staffId: string;
    amount: number;
    salesDate: string;
    createdAt: string;
  }[];
  notInputStaff: string[];
};
