/**
 * Authenticated reads of user profiles via the backend `GET /api/users/:id` route
 * (C++ `get_user` registry). This is the single client entry point for that API.
 */
import type { UserProfile } from "@/components/EditProfileModal"
import { API_ORIGIN } from "./apiBase"

export async function fetchUserById(id: string, idToken: string): Promise<UserProfile> {
  const res = await fetch(`${API_ORIGIN}/api/users/${encodeURIComponent(id)}`, {
    headers: { Authorization: `Bearer ${idToken}` },
  })
  const data = (await res.json()) as UserProfile
  if (!res.ok) throw new Error("Failed to fetch user")
  return data
}
