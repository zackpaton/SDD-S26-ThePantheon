/**
 * HTTP origin of the Express backend (scheme + host + port, no trailing slash).
 * Set `NEXT_PUBLIC_API_URL` in `.env.local` when deploying (e.g. `https://api.example.com`).
 * Defaults to `http://localhost:3001` for local development.
 */
export const API_ORIGIN = (() => {
  const raw = process.env.NEXT_PUBLIC_API_URL
  if (typeof raw === "string" && raw.trim().length > 0) {
    return raw.trim().replace(/\/$/, "")
  }
  return "http://localhost:3001"
})()
