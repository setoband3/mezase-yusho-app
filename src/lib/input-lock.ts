import type { AppStore } from "./types";
import { listWorkingDays } from "./workdays";

export function getInputLockStatus(store: AppStore, today: string) {
  const activeStaff = store.staff.filter((member) => member.active);
  const allWorkingDays = listWorkingDays(
    store.goal.startDate,
    store.goal.endDate,
    store.goal.holidayDates,
  );
  const todayIndex = allWorkingDays.indexOf(today);

  if (todayIndex <= 0) {
    return {
      isLocked: false,
      pendingStaffNames: [] as string[],
      previousWorkingDay: null as string | null,
    };
  }

  const previousWorkingDay = allWorkingDays[todayIndex - 1];
  const submittedSet = new Set(
    store.checkins
      .filter((checkin) => checkin.checkinDate === previousWorkingDay)
      .map((checkin) => checkin.staffId),
  );

  const pendingStaffNames = activeStaff
    .filter((staff) => !submittedSet.has(staff.id))
    .map((staff) => staff.name);

  return {
    isLocked: pendingStaffNames.length > 0,
    pendingStaffNames,
    previousWorkingDay,
  };
}
