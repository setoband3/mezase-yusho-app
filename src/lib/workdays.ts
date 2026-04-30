function toYmd(date: Date): string {
  const formatter = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(date);
}

function ymdToDate(ymd: string): Date {
  return new Date(`${ymd}T00:00:00+09:00`);
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function isValidYmd(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function listWorkingDays(
  startDate: string,
  endDate: string,
  holidayDates: string[],
): string[] {
  if (!isValidYmd(startDate) || !isValidYmd(endDate)) {
    return [];
  }
  const start = ymdToDate(startDate);
  const end = ymdToDate(endDate);
  if (start > end) {
    return [];
  }

  const holidaySet = new Set(holidayDates);
  const days: string[] = [];
  let cursor = start;
  while (cursor <= end) {
    const ymd = toYmd(cursor);
    if (!holidaySet.has(ymd)) {
      days.push(ymd);
    }
    cursor = addDays(cursor, 1);
  }
  return days;
}
