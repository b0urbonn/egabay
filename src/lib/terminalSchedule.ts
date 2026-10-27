// Weekly terminal hours. `public.terminal_schedules` stores one validated row
// per weekday (PostgreSQL convention: day 0 = Sunday, see DATA-001); readers
// always get all seven days so a full week renders without gap handling.

export type TerminalScheduleStatus = 'open' | 'closed' | 'unpublished';

export type TerminalScheduleRow = {
  day_of_week: number;
  status: string;
  opens_at: string | null;
  closes_at: string | null;
  is_sample: boolean;
};

export type TerminalScheduleEntry = {
  dayOfWeek: number;
  status: TerminalScheduleStatus;
  opensAt: string | null;
  closesAt: string | null;
  isSample: boolean;
};

function isScheduleStatus(value: string): value is TerminalScheduleStatus {
  return value === 'open' || value === 'closed' || value === 'unpublished';
}

export function normalizeWeeklySchedule(rows: TerminalScheduleRow[] | null | undefined): TerminalScheduleEntry[] {
  const byDay = new Map<number, TerminalScheduleRow>();
  for (const row of rows ?? []) {
    if (typeof row?.day_of_week === 'number' && row.day_of_week >= 0 && row.day_of_week <= 6) {
      byDay.set(row.day_of_week, row);
    }
  }
  const week: TerminalScheduleEntry[] = [];
  for (let day = 0; day < 7; day += 1) {
    const row = byDay.get(day);
    if (row && isScheduleStatus(row.status)) {
      week.push({
        dayOfWeek: day,
        status: row.status,
        opensAt: row.status === 'open' ? row.opens_at : null,
        closesAt: row.status === 'open' ? row.closes_at : null,
        isSample: row.is_sample === true,
      });
    } else {
      week.push({ dayOfWeek: day, status: 'unpublished', opensAt: null, closesAt: null, isSample: false });
    }
  }
  return week;
}
