/** Single labeled row for read-only profile displays (empty values show N/A). */
export default function ProfileFieldRow({
  label,
  value,
}: {
  label: string
  value?: string | number | null
}) {
  const empty = value === undefined || value === null || value === ""
  return (
    <div className="text-sm">
      <span className="font-semibold">{label}: </span>
      {empty ? (
        <span className="text-gray-400 italic">N/A</span>
      ) : (
        <span>{String(value)}</span>
      )}
    </div>
  )
}
