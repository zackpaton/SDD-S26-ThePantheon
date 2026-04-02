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