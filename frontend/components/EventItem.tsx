type Event = {
  id: string
  title: string
  date: number // timestamp
  type?: string
  location?: string
}

interface Props {
  event: Event
}

export default function EventItem({ event }: Props) {
  return (
    <div className="bg-blue-500 text-white text-xs rounded px-1 py-0.5 truncate mb-1">
      {event.title}
    </div>
  )
}