/**
 * Compact clickable chip for a calendar day cell: title + event-type icon on
 * the right, tinted by fraternity color.
 */
import EventTypeIcon from '@/components/EventTypeIcon';
import type {CalendarEvent} from '@/components/calendar/calendarModel';

interface Props {
  event: Pick<CalendarEvent, 'id' | 'title' | 'eventType'>
  color: string
  onClick?: () => void
}

/**
 * Truncated title bar with small type icon; invokes onClick when the user
 * selects an event.
 */
export default function EventItem({event, color, onClick}: Props) {
  return (
    <div
      onClick={onClick}
      className={
        `${color} mb-1 flex min-w-0 cursor-pointer items-center ` +
        'gap-0.5 rounded px-1 py-0.5 text-xs text-white'
      }
    >
      <span className="min-w-0 flex-1 truncate">{event.title}</span>
      <span className="pointer-events-none shrink-0 text-white drop-shadow-sm">
        <EventTypeIcon eventType={event.eventType} className="h-3 w-3" />
      </span>
    </div>
  );
}
