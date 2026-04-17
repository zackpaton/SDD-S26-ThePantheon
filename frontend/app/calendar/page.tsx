/**
 * Calendar route: renders the main fraternity calendar component inside a padded layout.
 */
import Calendar from "@/components/calendar/Calendar"

/** Server component wrapper around the client Calendar shell. */
export default function CalendarPage() {
  return (
    <div className="box-border flex min-h-0 flex-1 flex-col overflow-hidden p-8">
      <Calendar />
    </div>
  )
}