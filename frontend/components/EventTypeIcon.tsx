/**
 * Maps calendar event type labels to Lucide icons (vector, no image assets).
 */
import {
  CalendarDays,
  HeartHandshake,
  PartyPopper,
  UserPlus,
  type LucideIcon,
} from 'lucide-react';

const EVENT_TYPE_ICONS: Record<string, LucideIcon> = {
  Recruitment: UserPlus,
  Philanthropy: HeartHandshake,
  Social: PartyPopper,
  Other: CalendarDays,
};

type EventTypeIconProps = {
  eventType: string
  className?: string
}

/**
 * Small icon for Recruitment / Philanthropy / Social / Other; falls back to
 * CalendarDays.
 */
export default function EventTypeIcon({
  eventType,
  className = '',
}: EventTypeIconProps) {
  const Icon = EVENT_TYPE_ICONS[eventType] ?? CalendarDays;
  const iconCls = `shrink-0 ${className}`.trim();
  return (
    <Icon className={iconCls} strokeWidth={2} aria-hidden />
  );
}
