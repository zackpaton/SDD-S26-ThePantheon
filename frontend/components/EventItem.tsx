/**
 * Compact clickable chip showing an event title on a calendar day cell, tinted by fraternity color.
 */
type Event = {
  id: string
  title: string
  // other event fields as needed
}

interface Props {
  event: Event
  color: string
  onClick?: () => void // <-- add optional onClick prop
}

/** Renders a single truncated title bar; invokes onClick when the user selects an event. */
export default function EventItem({ event, color, onClick }: Props) {
  return (
    <div
      onClick={onClick} // <-- attach it here
      className={`${color} text-white text-xs rounded px-1 py-0.5 truncate mb-1 cursor-pointer`} // cursor-pointer makes it obvious it's clickable
    >
      {event.title}
    </div>
  )
}