'use client';

/**
 * Month grid view: day cells with event chips; filters and modals live in
 * Calendar.tsx. When a day has more chips than fit, "+N more" opens a list
 * (Google Calendar–style).
 */
import {useEffect, useState} from 'react';

import {generateMonthMatrix} from '@/lib/dateUtils';
import EventTypeIcon from '@/components/EventTypeIcon';

import EventItem from '@/components/EventItem';

import type {CalendarBoardState} from './useCalendarBoard';
import type {CalendarEvent} from './calendarModel';

export type {CalendarEvent} from './calendarModel';

/** Fits ~3 compact chips in the h-24 day cell under the date number. */
const MAX_VISIBLE_EVENT_CHIPS = 2;

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export default function MonthView({
  currentDate,
  board,
}: {
  currentDate: Date
  board: CalendarBoardState
}) {
  const monthMatrix = generateMonthMatrix(currentDate);
  const now = new Date();

  const {setSelectedEvent, setShowEventDetails, getEventsForDay} = board;

  const [overflowDay, setOverflowDay] = useState<{
    day: Date
    events: CalendarEvent[]
  } | null>(null);

  useEffect(() => {
    if (!overflowDay) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOverflowDay(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [overflowDay]);

  return (
    <div className="min-h-0 min-w-0 flex-1 overflow-auto">
      <div className="mb-2 grid grid-cols-7 text-center font-semibold">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {monthMatrix.map((week, i) =>
          week.map((day, j) => {
            const sorted = [...getEventsForDay(day)].sort(
              (a, b) => a.startTime - b.startTime,
            );
            const visible = sorted.slice(0, MAX_VISIBLE_EVENT_CHIPS);
            const moreCount = sorted.length - visible.length;
            const isToday = isSameDay(day, now);

            return (
              <div
                key={`${i}-${j}`}
                className={
                  'flex h-24 flex-col overflow-hidden rounded border ' +
                  'bg-white p-1 text-sm'
                }
              >
                <div
                  className={
                    'shrink-0 text-left text-xs font-semibold leading-none'
                  }
                >
                  {isToday ? (
                    <span
                      className={
                        'inline-flex h-4 w-4 items-center justify-center ' +
                        'rounded-full bg-blue-600 text-[11px] font-semibold ' +
                        'text-white'
                      }
                    >
                      {day.getDate()}
                    </span>
                  ) : (
                    day.getDate()
                  )}
                </div>

                <div className="min-h-0 flex-1 overflow-hidden">
                  {visible.map((event) => {
                    const colorClass = event.color || 'bg-gray-500';
                    return (
                      <EventItem
                        key={event.id}
                        event={event}
                        color={colorClass}
                        onClick={() => {
                          setSelectedEvent(event);
                          setShowEventDetails(true);
                        }}
                      />
                    );
                  })}

                  {moreCount > 0 && (
                    <button
                      type="button"
                      aria-label={`${moreCount} more events`}
                      onClick={() => setOverflowDay({day, events: sorted})}
                      className={
                        'mt-0.5 w-full whitespace-nowrap rounded px-0.5 ' +
                        'py-0.5 text-left text-[11px] font-semibold ' +
                        'leading-none text-purple-800 hover:bg-purple-100 ' +
                        'hover:underline'
                      }
                    >
                      <span className="inline sm:hidden">. . .</span>
                      <span className="hidden sm:inline">{moreCount} more</span>
                    </button>
                  )}
                </div>
              </div>
            );
          }),
        )}
      </div>

      {overflowDay && (
        <div
          className={
            'fixed inset-0 z-[100] flex items-center justify-center ' +
            'bg-black/40 p-3 sm:p-4'
          }
          role="dialog"
          aria-modal="true"
          aria-labelledby="month-overflow-title"
          onClick={() => setOverflowDay(null)}
        >
          <div
            className={
              'relative flex max-h-[min(70vh,480px)] w-full max-w-sm ' +
              'flex-col overflow-hidden rounded-lg border-2 border-black ' +
              'bg-white shadow-lg'
            }
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Close"
              className={
                'absolute right-2 top-2 z-10 text-gray-500 ' +
                'hover:text-gray-700'
              }
              onClick={() => setOverflowDay(null)}
            >
              ✕
            </button>
            <h2
              id="month-overflow-title"
              className={
                'border-b border-black/15 px-4 py-3 pr-10 text-base font-bold'
              }
            >
              {overflowDay.day.toLocaleDateString(undefined, {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </h2>
            <ul className="min-h-0 flex-1 overflow-y-auto p-2">
              {overflowDay.events.map((ev) => {
                const colorClass = ev.color || 'bg-gray-500';
                return (
                  <li key={ev.id} className="mb-1 last:mb-0">
                    <button
                      type="button"
                      onClick={() => {
                        setOverflowDay(null);
                        setSelectedEvent(ev);
                        setShowEventDetails(true);
                      }}
                      className={
                        `flex w-full items-start gap-2 rounded px-2 py-1.5 ` +
                        `text-left text-sm text-white ${colorClass} ` +
                        'hover:brightness-110'
                      }
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold">
                          {ev.title}
                        </span>
                        <span className="block text-xs opacity-90">
                          {new Date(ev.startTime * 1000).toLocaleTimeString(
                            undefined,
                            {
                              hour: 'numeric',
                              minute: '2-digit',
                            },
                          )}{' '}
                          · {ev.fraternity}
                        </span>
                      </span>
                      <span
                        className={
                          'pointer-events-none shrink-0 text-white ' +
                          'drop-shadow-sm'
                        }
                      >
                        <EventTypeIcon
                          eventType={ev.eventType}
                          className="h-4 w-4"
                        />
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
