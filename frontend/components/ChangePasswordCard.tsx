"use client"

/**
 * Re-authenticates with the current password, then updates Firebase Auth password.
 */
import { useState, type FormEvent } from "react"
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  type User,
} from "firebase/auth"
import { auth } from "@/lib/firebase"

const inputClass =
  "w-full rounded border border-gray-300 px-3 py-2.5 text-base text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 sm:py-2 sm:text-sm"

function firebaseErrorMessage(code: string): string {
  switch (code) {
    case "auth/wrong-password":
      return "Current password is incorrect."
    case "auth/weak-password":
      return "New password is too weak. Use at least 6 characters."
    case "auth/requires-recent-login":
      return "For security, sign out and sign in again, then change your password."
    case "auth/too-many-requests":
      return "Too many attempts. Try again later."
    default:
      return "Could not update password. Please try again."
  }
}

export default function ChangePasswordCard({ user }: { user: User }) {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [busy, setBusy] = useState(false)

  const hasEmailPassword = user.providerData.some(p => p.providerId === "password")

  if (!hasEmailPassword) {
    return (
      <p className="text-sm text-neutral-600">
        Password changes apply to accounts that use email and password. If you use another sign-in
        method, manage your password with that provider.
      </p>
    )
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters.")
      return
    }
    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.")
      return
    }
    if (newPassword === currentPassword) {
      setError("New password must be different from your current password.")
      return
    }

    const u = auth.currentUser
    const email = u?.email ?? user.email
    if (!u || !email) {
      setError("Session expired. Please sign in again.")
      return
    }

    setBusy(true)
    try {
      const credential = EmailAuthProvider.credential(email, currentPassword)
      await reauthenticateWithCredential(u, credential)
      await updatePassword(u, newPassword)
      setSuccess(true)
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (err: unknown) {
      const code =
        err && typeof err === "object" && "code" in err
          ? String((err as { code?: string }).code)
          : ""
      setError(code ? firebaseErrorMessage(code) : "Something went wrong.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      {success && (
        <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-800" role="status">
          Password updated successfully.
        </p>
      )}
      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {error}
        </p>
      )}

      <div>
        <label htmlFor="current-password" className="mb-1 block text-sm font-medium text-neutral-800">
          Current password
        </label>
        <input
          id="current-password"
          type="password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={e => setCurrentPassword(e.target.value)}
          className={inputClass}
          disabled={busy}
        />
      </div>

      <div>
        <label htmlFor="new-password" className="mb-1 block text-sm font-medium text-neutral-800">
          New password
        </label>
        <input
          id="new-password"
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
          className={inputClass}
          disabled={busy}
        />
      </div>

      <div>
        <label htmlFor="confirm-password" className="mb-1 block text-sm font-medium text-neutral-800">
          Confirm new password
        </label>
        <input
          id="confirm-password"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          className={inputClass}
          disabled={busy}
        />
      </div>

      <button
        type="submit"
        disabled={busy}
        className="min-h-[44px] w-full rounded bg-purple-400 py-2.5 text-sm font-semibold text-white hover:bg-purple-500 disabled:opacity-50 sm:min-h-0 sm:w-auto sm:px-6 sm:py-2"
      >
        {busy ? "Updating…" : "Update Password"}
      </button>
    </form>
  )
}
