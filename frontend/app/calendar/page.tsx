/**
 * Calendar route: renders the main fraternity calendar component inside a padded layout.
 */
import PageShell from "@/components/PageShell"
import Calendar from "@/components/calendar/Calendar"

/** Server component wrapper around the client Calendar shell. */
export default function CalendarPage() {
  return (
    <PageShell>
      <Calendar />
    </PageShell>
  )
}