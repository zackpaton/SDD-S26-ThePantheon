"use client"

/**
 * Profile route: shows the signed-in user’s backend profile, logout, and optional edit modal.
 */
import { useEffect, useState } from "react"
import type { User } from "firebase/auth"
import PageShell from "@/components/PageShell"
import ChangePasswordCard from "@/components/ChangePasswordCard"
import { API_ORIGIN } from "@/lib/apiBase"
import { auth } from "@/lib/firebase"
import { onAuthStateChanged, signOut } from "firebase/auth"
import EditProfileModal, { type UserProfile } from "@/components/EditProfileModal"

/** Renders a field value or a gray “N/A” placeholder when empty. */
function DisplayValue({ value }: { value?: string | number | null }) {
  const isEmpty = value === undefined || value === null || value === ""
  return (
    <span className={isEmpty ? "text-gray-400 italic" : ""}>
      {isEmpty ? "N/A" : value}
    </span>
  )
}

/** Subscribes to auth, fetches `/api/users/:uid`, and renders profile fields with edit/logout actions. */
export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setUser(null)
        return
      }

      setUser(currentUser)

      try {
        const token = await currentUser.getIdToken()
        const res = await fetch(`${API_ORIGIN}/api/users/${currentUser.uid}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        setProfile(data)
      } catch (err) {
        console.error("Failed to load profile:", err)
      }
    })

    return () => unsubscribe()
  }, [])

  /** Signs out of Firebase and sends the browser to /login. */
  const handleLogout = async () => {
    try {
      await signOut(auth)
      window.location.href = "/login"
    } catch (err) {
      console.error("Logout error:", err)
    }
  }

  if (!user) {
    return (
      <PageShell>
        <p className="text-center text-lg text-neutral-800">You are not logged in.</p>
      </PageShell>
    )
  }

  return (
    <PageShell>
      <div className="flex min-h-0 w-full max-w-xl flex-1 flex-col self-center overflow-hidden">
        <h1 className="mb-3 shrink-0 text-2xl font-bold text-neutral-950 sm:mb-4">Profile</h1>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-gutter:stable]">
          <div className="flex flex-col gap-6 pb-2">
            <div className="flex flex-col gap-4 rounded-lg bg-white p-4 shadow sm:p-6">
              <div>
                <span className="font-semibold">First Name: </span>
                <DisplayValue value={profile?.firstName} />
              </div>

              <div>
                <span className="font-semibold">Last Name: </span>
                <DisplayValue value={profile?.lastName} />
              </div>

              <div>
                <span className="font-semibold">Class Year: </span>
                <DisplayValue value={profile?.classYear} />
              </div>

              <div>
                <span className="font-semibold">Major: </span>
                <DisplayValue value={profile?.major} />
              </div>

              <div>
                <span className="font-semibold">Interests: </span>
                <DisplayValue value={profile?.interests} />
              </div>

              <div>
                <span className="font-semibold">Email: </span>
                {user.email}
              </div>

              <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(true)}
                  className="min-h-[44px] rounded bg-blue-500 px-4 py-2.5 text-white hover:bg-blue-600 sm:min-h-0"
                >
                  Edit Profile
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="min-h-[44px] rounded bg-red-500 px-4 py-2.5 text-white hover:bg-red-600 sm:min-h-0"
                >
                  Logout
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-3 rounded-lg bg-white p-4 shadow sm:p-6">
              <h2 className="text-lg font-semibold text-neutral-900">Change Password</h2>
              <p className="text-sm text-neutral-600">
                Enter your current password, then choose a new one. This updates your sign-in password.
              </p>
              <ChangePasswordCard user={user} />
            </div>
          </div>
        </div>
      </div>

      {showEditModal && profile && user && (
        <EditProfileModal
          profile={profile}
          userId={user.uid}
          onClose={() => setShowEditModal(false)}
          onSave={(updatedProfile) => setProfile(updatedProfile)}
        />
      )}
    </PageShell>
  )
}