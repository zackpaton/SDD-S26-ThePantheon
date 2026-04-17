/**
 * Normalizes API JSON error bodies into a single user-facing string.
 */
export function getApiErrorMessage(body: unknown, fallback: string): string {
  if (body == null || typeof body !== "object") return fallback
  const o = body as Record<string, unknown>
  if (typeof o.error === "string" && o.error.trim()) return o.error
  if (o.error && typeof o.error === "object") {
    const e = o.error as Record<string, unknown>
    if (typeof e.message === "string" && e.message.trim()) return e.message
  }
  if (typeof o.message === "string" && o.message.trim()) return o.message
  return fallback
}
