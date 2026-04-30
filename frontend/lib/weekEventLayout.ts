/**
 * Positions overlapping timed events in a single day column (week view):
 * greedy column packing plus per-event width based on concurrent overlap count
 * (Google Calendar–style columns).
 */
import type {CalendarEvent} from '@/components/calendar/calendarModel';

const TOTAL_MINUTES = 24 * 60;

function dayBounds(day: Date) {
  const ys = day.getFullYear();
  const ms = day.getMonth();
  const ds = day.getDate();
  return {
    dayStart: new Date(ys, ms, ds, 0, 0, 0, 0),
    dayEnd: new Date(ys, ms, ds, 23, 59, 59, 999),
  };
}

function toMinutes(d: Date) {
  return d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60;
}

export function getVisibleDayInterval(
  event: CalendarEvent,
  day: Date,
): {
  startMin: number;
  endMin: number;
  topPct: number;
  heightPct: number;
} | null {
  const start = new Date(event.startTime * 1000);
  const end = new Date(event.endTime * 1000);
  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    end <= start
  ) {
    return null;
  }

  const {dayStart, dayEnd} = dayBounds(day);
  if (end < dayStart || start > dayEnd) return null;

  const visStart = start < dayStart ? dayStart : start;
  const visEnd = end > dayEnd ? dayEnd : end;

  const startMin = toMinutes(visStart);
  const endMin = toMinutes(visEnd);
  const topPct = (startMin / TOTAL_MINUTES) * 100;
  const heightPct = Math.max(((endMin - startMin) / TOTAL_MINUTES) * 100, 1.25);
  return {startMin, endMin, topPct, heightPct};
}

function intervalsOverlap(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number,
) {
  return aStart < bEnd && aEnd > bStart;
}

type Row = {
  event: CalendarEvent
  startMin: number
  endMin: number
  topPct: number
  heightPct: number
  column: number
}

/**
 * Returns CSS percentage positions for each event id in one day column.
 */
type WeekLayoutEntry = {
  topPct: number;
  heightPct: number;
  leftPct: number;
  widthPct: number;
};

export function layoutWeekDayEvents(
  events: CalendarEvent[],
  day: Date,
): Map<string, WeekLayoutEntry> {
  const rows: Row[] = [];
  for (const event of events) {
    const vis = getVisibleDayInterval(event, day);
    if (!vis) continue;
    rows.push({
      event,
      startMin: vis.startMin,
      endMin: vis.endMin,
      topPct: vis.topPct,
      heightPct: vis.heightPct,
      column: 0,
    });
  }

  rows.sort((a, b) => {
    if (a.startMin !== b.startMin) return a.startMin - b.startMin;
    return b.endMin - a.endMin;
  });

  const colEnds: number[] = [];

  for (const row of rows) {
    let placed = false;
    for (let c = 0; c < colEnds.length; c++) {
      if (colEnds[c] <= row.startMin) {
        row.column = c;
        colEnds[c] = row.endMin;
        placed = true;
        break;
      }
    }
    if (!placed) {
      row.column = colEnds.length;
      colEnds.push(row.endMin);
    }
  }

  const out = new Map<string, WeekLayoutEntry>();

  for (const row of rows) {
    const overlap = rows.filter((o) =>
      intervalsOverlap(o.startMin, o.endMin, row.startMin, row.endMin),
    );
    const numCols = Math.max(1, ...overlap.map((o) => o.column + 1));
    const widthPct = 100 / numCols;
    const leftPct = (row.column / numCols) * 100;
    out.set(row.event.id, {
      topPct: row.topPct,
      heightPct: row.heightPct,
      leftPct,
      widthPct,
    });
  }

  return out;
}
