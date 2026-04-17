/**
 * Site root: always send visitors to the calendar (no separate marketing home).
 */
import { permanentRedirect } from "next/navigation"

export default function Home() {
  permanentRedirect("/calendar")
}
