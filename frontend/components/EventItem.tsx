import { fraternityColors } from "@/data/fraternities"

type Event = {
  id: string
  title: string
  // no need to include fraternity here for color display
}

interface Props {
  event: Event
  color: string
}

export default function EventItem({ event, color }: Props) {
  return (
    <div className={`${color} text-white text-xs rounded px-1 py-0.5 truncate mb-1`}>
      {event.title}
    </div>
  )
}