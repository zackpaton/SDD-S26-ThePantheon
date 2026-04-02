"use client"

import { useEffect, useState } from "react"
import { auth } from "@/lib/firebase"
import { onAuthStateChanged, signOut } from "firebase/auth"
import EditProfileModal from "@/components/EditProfileModal"

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [showEditModal, setShowEditModal] = useState(false)

  // -----------------------------
  // Load user & profile
  // -----------------------------
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setUser(null)
        return
      }

      setUser(currentUser)

      try {
        const token = await currentUser.getIdToken()
        const res = await fetch(`http://localhost:3001/api/users/${currentUser.uid}`, {
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

  // -----------------------------
  // Handle logout
  // -----------------------------
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
      <div className="p-8 text-center">
        <p className="text-lg">You are not logged in.</p>
      </div>
    )
  }

  function DisplayValue({ value }: { value?: string | number | null }) {
    const isEmpty = value === undefined || value === null || value === ""
    return (
      <span className={isEmpty ? "text-gray-400 italic" : ""}>
        {isEmpty ? "N/A" : value}
      </span>
    )
  }

  return (
    <div className="p-8 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Profile</h1>

      <div className="bg-white shadow rounded p-6 flex flex-col gap-4">
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

        <div className="flex gap-2 mt-2">
          <button
            onClick={() => setShowEditModal(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Edit Profile
          </button>

          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && profile && user && (
        <EditProfileModal
          profile={profile}
          userId={user.uid}
          onClose={() => setShowEditModal(false)}
          onSave={(updatedProfile) => setProfile(updatedProfile)}
        />
      )}
    </div>
  )
}