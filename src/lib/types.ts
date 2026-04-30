export type Staff = {
  id: string;
  name: string;
  active: boolean;
};

export type GoalSettings = {
  totalTargetAmount: number;
  startDate: string;
  endDate: string;
  holidayDates: string[];
};

export type SaleLog = {
  id: string;
  staffId: string;
  amount: number;
  salesDate: string;
  createdAt: string;
};

export type CheckinLog = {
  id: string;
  staffId: string;
  checkinDate: string;
  createdAt: string;
};

export type AppStore = {
  staff: Staff[];
  goal: GoalSettings;
  sales: SaleLog[];
  checkins: CheckinLog[];
};
