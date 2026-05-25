// Utility helper functions for Cycle Calculation and Calendar Predictions

/**
 * Parses YYYY-MM-DD date string safely.
 */
export function parseDateString(dateStr: string): Date {
  const parts = dateStr.split('-');
  return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
}

/**
 * Formats standard Date to YYYY-MM-DD.
 */
export function formatDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Prettifies date to readable Indonesian format e.g. "16 Mei 2025" or "16 May 2025"
 */
export function formatReadableDate(dateStr: string, isIndonesian = true): string {
  if (!dateStr) return '';
  const date = parseDateString(dateStr);
  const monthIndo = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const monthEng = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  
  const m = isIndonesian ? monthIndo[date.getMonth()] : monthEng[date.getMonth()];
  return `${date.getDate()} ${m} ${date.getFullYear()}`;
}

/**
 * Generates predictions based on latest historic cycle records.
 */
export function calculateCyclePredictions(
  latestStartDateStr: string, 
  cycleLength = 28, 
  periodLength = 5
) {
  const latestStart = parseDateString(latestStartDateStr);
  
  // Next suggested period start
  const nextStart = new Date(latestStart);
  nextStart.setDate(latestStart.getDate() + cycleLength);
  
  // Next cycle end
  const nextEnd = new Date(nextStart);
  nextEnd.setDate(nextStart.getDate() + periodLength - 1);
  
  // Ovulation (usually 14 days before next period)
  const ovulation = new Date(nextStart);
  ovulation.setDate(nextStart.getDate() - 14);
  
  // Fertile Window: 5 days before ovulation and 1 day after
  const fertileStart = new Date(ovulation);
  fertileStart.setDate(ovulation.getDate() - 5);
  
  const fertileEnd = new Date(ovulation);
  fertileEnd.setDate(ovulation.getDate() + 1);

  return {
    nextPredictedStart: formatDateString(nextStart),
    nextPredictedEnd: formatDateString(nextEnd),
    ovulationDate: formatDateString(ovulation),
    fertileStart: formatDateString(fertileStart),
    fertileEnd: formatDateString(fertileEnd),
  };
}

/**
 * Returns current phase of cycle based on days elapsed since latest period start.
 */
export function getCyclePhase(
  latestStartDateStr: string,
  todayStr: string,
  cycleLength = 28,
  periodLength = 5
): { phase: string; percentElapsed: number; daysLeft: number } {
  const latestStart = parseDateString(latestStartDateStr);
  const today = parseDateString(todayStr);
  
  // Difference in days
  const elapsedMs = today.getTime() - latestStart.getTime();
  const elapsedDays = Math.floor(elapsedMs / (1000 * 60 * 60 * 24));
  
  // Cycle relative loop day
  const relativeDay = ((elapsedDays % cycleLength) + cycleLength) % cycleLength;
  const daysLeft = cycleLength - relativeDay;
  const percentElapsed = Math.round((relativeDay / cycleLength) * 100);
  
  let phase = 'Fase Luteal'; // Fallback
  
  if (relativeDay < periodLength) {
    phase = 'Fase Menstruasi';
  } else if (relativeDay < 12) {
    phase = 'Fase Folikular (Pra-ovulasi)';
  } else if (relativeDay >= 12 && relativeDay <= 15) {
    phase = 'Masa Subur (Ovulasi)';
  } else {
    phase = 'Fase Luteal (PMS)';
  }
  
  return {
    phase,
    percentElapsed,
    daysLeft: daysLeft > 0 ? daysLeft : cycleLength,
  };
}

/**
 * Returns month calendar grid days including offsets from prev/next months.
 */
export interface CalendarDay {
  dateStr: string;
  dayNum: number;
  isCurrentMonth: boolean;
  isMenstruation: boolean;
  isOvulation: boolean;
  isFertile: boolean;
  isLuteal: boolean;
}

export function buildCalendarMonth(
  year: number, 
  monthIndex: number, // 0-11
  latestStartDateStr: string | null,
  cycleLength = 28,
  periodLength = 5
): CalendarDay[] {
  const firstDayOfMonth = new Date(year, monthIndex, 1);
  const lastDayOfMonth = new Date(year, monthIndex + 1, 0);
  
  // Day of week of first day (0=Sunday, 1=Monday... our calendar starts on Monday!)
  let startDayOffset = firstDayOfMonth.getDay() - 1; 
  if (startDayOffset < 0) startDayOffset = 6; // Sunday becomes 6
  
  const daysInMonth = lastDayOfMonth.getDate();
  const calendarDays: CalendarDay[] = [];
  
  // Days of previous month to pad front
  const prevMonthLastDay = new Date(year, monthIndex, 0).getDate();
  for (let i = startDayOffset - 1; i >= 0; i--) {
    const d = prevMonthLastDay - i;
    const prevMonthIndex = monthIndex === 0 ? 11 : monthIndex - 1;
    const prevYear = monthIndex === 0 ? year - 1 : year;
    const dateStr = `${prevYear}-${String(prevMonthIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calendarDays.push({
      dateStr,
      dayNum: d,
      isCurrentMonth: false,
      ...getDayPhases(dateStr, latestStartDateStr, cycleLength, periodLength)
    });
  }
  
  // Days of current month
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calendarDays.push({
      dateStr,
      dayNum: d,
      isCurrentMonth: true,
      ...getDayPhases(dateStr, latestStartDateStr, cycleLength, periodLength)
    });
  }
  
  // Days of next month to pad end (up to 42 total slots matching 6 rows)
  const remainingSlots = 42 - calendarDays.length;
  for (let d = 1; d <= remainingSlots; d++) {
    const nextMonthIndex = monthIndex === 11 ? 0 : monthIndex + 1;
    const nextYear = monthIndex === 11 ? year + 1 : year;
    const dateStr = `${nextYear}-${String(nextMonthIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calendarDays.push({
      dateStr,
      dayNum: d,
      isCurrentMonth: false,
      ...getDayPhases(dateStr, latestStartDateStr, cycleLength, periodLength)
    });
  }
  
  return calendarDays;
}

function getDayPhases(
  dateStr: string,
  latestStartDateStr: string | null,
  cycleLength = 28,
  periodLength = 5
) {
  if (!latestStartDateStr) {
    return { isMenstruation: false, isOvulation: false, isFertile: false, isLuteal: false };
  }
  
  const dateObj = parseDateString(dateStr);
  const baseStart = parseDateString(latestStartDateStr);
  
  // Elapsed diff in days
  const elapsedMs = dateObj.getTime() - baseStart.getTime();
  const elapsedDays = Math.floor(elapsedMs / (1000 * 60 * 60 * 24));
  
  // Loop cycle day (can be positive or negative)
  // Positive/negative modulo
  const relativeDay = ((elapsedDays % cycleLength) + cycleLength) % cycleLength;
  
  const isMenstruation = relativeDay < periodLength;
  const isFertile = relativeDay >= 8 && relativeDay <= 15;
  const isOvulation = relativeDay === 14; 
  const isLuteal = relativeDay >= 16;
  
  return { isMenstruation, isOvulation, isFertile, isLuteal };
}
