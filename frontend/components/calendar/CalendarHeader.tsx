/**
 * Period navigation and month/week toggle: arrows step by month or week
 * depending on active view.
 */
import {formatWeekRangeLabel, getWeekDaysContaining} from '@/lib/dateUtils';

interface Props {
  view: 'month' | 'week'
  setView: (v: 'month' | 'week') => void
  currentDate: Date
  setCurrentDate: (d: Date) => void
}

export default function CalendarHeader({
  view,
  setView,
  currentDate,
  setCurrentDate,
}: Props) {
  const goPrev = () => {
    if (view === 'month') {
      setCurrentDate(
        new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1),
      );
    } else {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 7);
      setCurrentDate(d);
    }
  };

  const goNext = () => {
    if (view === 'month') {
      setCurrentDate(
        new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1),
      );
    } else {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 7);
      setCurrentDate(d);
    }
  };

  const title =
    view === 'month' ?
      `${currentDate.toLocaleString('default', {
        month: 'long',
      })} ${currentDate.getFullYear()}` :
      formatWeekRangeLabel(getWeekDaysContaining(currentDate));

  const btnBase =
    'cursor-pointer rounded border border-black bg-purple-400 px-2 py-1 ' +
    'text-black transition-colors hover:bg-purple-500';

  return (
    <div
      className={
        'mb-3 grid grid-cols-[auto_minmax(0,1fr)_auto] ' +
        'items-center gap-2 sm:mb-4'
      }
    >
      <div className="flex gap-1 sm:gap-2">
        <button
          type="button"
          onClick={goPrev}
          className={
            `${btnBase} min-h-10 min-w-10 px-2 py-2 sm:min-h-0 sm:min-w-0`
          }
          aria-label={view === 'month' ? 'Previous month' : 'Previous week'}
        >
          ◀
        </button>
        <button
          type="button"
          onClick={goNext}
          className={
            `${btnBase} min-h-10 min-w-10 px-2 py-2 sm:min-h-0 sm:min-w-0`
          }
          aria-label={view === 'month' ? 'Next month' : 'Next week'}
        >
          ▶
        </button>
      </div>

      <h2
        className={
          'min-w-0 truncate px-1 text-center text-xs font-bold ' +
          'leading-tight sm:text-lg'
        }
      >
        {title}
      </h2>

      <div className="flex justify-end gap-1 sm:gap-2">
        <button
          type="button"
          onClick={() => setView('month')}
          className={
            `${btnBase} min-h-10 shrink-0 px-2 py-1.5 text-xs ` +
            'sm:min-h-0 sm:px-2 sm:py-1 sm:text-sm ' +
            (view === 'month' ?
              'font-bold ring-2 ring-black ring-offset-2 ' +
              'ring-offset-purple-500' :
              '')
          }
        >
          Month
        </button>
        <button
          type="button"
          onClick={() => setView('week')}
          className={
            `${btnBase} min-h-10 shrink-0 px-2 py-1.5 text-xs ` +
            'sm:min-h-0 sm:px-2 sm:py-1 sm:text-sm ' +
            (view === 'week' ?
              'font-bold ring-2 ring-black ring-offset-2 ' +
              'ring-offset-purple-500' :
              '')
          }
        >
          Week
        </button>
      </div>
    </div>
  );
}
