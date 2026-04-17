"use client"

/**
 * Registration form: creates a Firebase user then POSTs profile (role, fraternity) to the backend.
 */
import { useState } from "react"
import { createUserWithEmailAndPassword } from "firebase/auth"
import { API_ORIGIN } from "@/lib/apiBase"
import { getApiErrorMessage } from "@/lib/apiErrorMessage"
import { firebaseAuthErrorMessage } from "@/lib/firebaseAuthErrorMessage"
import { auth } from "@/lib/firebase"
import { useRouter } from "next/navigation"
import { fraternities } from "@/data/fraternities"

function isValidEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim())
}

/** Validates passwords, creates the auth account, syncs `/api/users`, and sends the user to the calendar. */
export default function SignUpForm() {
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [role, setRole] = useState("")
  const [fraternity, setFraternity] = useState("")
  const [formError, setFormError] = useState("")
  const [busy, setBusy] = useState(false)

  const router = useRouter()

  /** Runs client-side checks, Firebase signup, and backend user creation in sequence. */
  const handleSignup = async () => {
    setFormError("")
    if (!firstName.trim()) {
      setFormError("First name is required.")
      return
    }
    if (!lastName.trim()) {
      setFormError("Last name is required.")
      return
    }
    if (!email.trim()) {
      setFormError("Email is required.")
      return
    }
    if (!isValidEmail(email)) {
      setFormError("Enter a valid email address.")
      return
    }
    if (!role) {
      setFormError("Please select your role (guest or event coordinator).")
      return
    }
    if (password !== confirmPassword) {
      setFormError("Passwords do not match.")
      return
    }
    if (password.length < 6) {
      setFormError("Password must be at least 6 characters.")
      return
    }
    if (role === "Event Coordinator" && !fraternity) {
      setFormError("Please select your fraternity.")
      return
    }

    setBusy(true)
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password,
      )

      const res = await fetch(`${API_ORIGIN}/api/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uid: userCredential.user.uid,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          role,
          fraternity: role === "Event Coordinator" ? fraternity : null,
        }),
      })

      const body: unknown = await res.json().catch(() => ({}))
      if (!res.ok) {
        setFormError(
          getApiErrorMessage(
            body,
            "Could not save your profile. Try signing in, or contact support if this continues.",
          ),
        )
        return
      }

      router.push("/calendar")
    } catch (err) {
      setFormError(firebaseAuthErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const inputClass =
    "w-full rounded border border-gray-300 px-3 py-2.5 text-base text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 sm:py-2 sm:text-sm"

  return (
    <div className="flex min-h-[100dvh] items-center justify-center px-4 py-8 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <form
        className="mb-4 w-full max-w-sm rounded-lg bg-white p-6 shadow-md sm:px-8 sm:pt-6 sm:pb-8"
        onSubmit={(e) => e.preventDefault()}
      >
        {formError ? (
          <p className="mb-4 text-sm text-red-600" role="alert">
            {formError}
          </p>
        ) : null}

        {/* First Name */}
        <div className="mb-4">
          <input
            className={inputClass}
            type="text"
            placeholder="First Name"
            autoComplete="given-name"
            value={firstName}
            onChange={(e) => {
              setFormError("")
              setFirstName(e.target.value)
            }}
          />
        </div>

        {/* Last Name */}
        <div className="mb-4">
          <input
            className={inputClass}
            type="text"
            placeholder="Last Name"
            autoComplete="family-name"
            value={lastName}
            onChange={(e) => {
              setFormError("")
              setLastName(e.target.value)
            }}
          />
        </div>

        {/* Email */}
        <div className="mb-4">
          <input
            className={inputClass}
            type="email"
            placeholder="Email"
            autoComplete="email"
            value={email}
            onChange={(e) => {
              setFormError("")
              setEmail(e.target.value)
            }}
          />
        </div>

        {/* Password */}
        <div className="mb-4">
          <input
            className={inputClass}
            type="password"
            placeholder="Password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => {
              setFormError("")
              setPassword(e.target.value)
            }}
          />
        </div>

        {/* Confirm Password */}
        <div className="mb-4">
          <input
            className={inputClass}
            type="password"
            placeholder="Confirm Password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => {
              setFormError("")
              setConfirmPassword(e.target.value)
            }}
          />
        </div>

        {/* Role Dropdown */}
        <div className="mb-4">
          <select
            className={`${inputClass} bg-white`}
            value={role}
            onChange={(e) => {
              setFormError("")
              setRole(e.target.value)
            }}
          >
            <option value="" disabled hidden>
              Select Role
            </option>
            <option>Guest User</option>
            <option>Event Coordinator</option>
          </select>
        </div>

        {/* Fraternity Dropdown (Conditional) */}
        {role === "Event Coordinator" && (
          <div className="mb-4">
            <select
              className={`${inputClass} bg-white`}
              value={fraternity}
              onChange={(e) => {
                setFormError("")
                setFraternity(e.target.value)
              }}
            >
              <option value="" disabled hidden>
                Select Fraternity
              </option>
              {fraternities.map(f => (
                <option key={f.name}>{f.name}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <button
            type="button"
            disabled={busy}
            onClick={() => void handleSignup()}
            className="min-h-[44px] w-full rounded bg-purple-500 py-2.5 font-bold text-white hover:bg-purple-700 disabled:opacity-60 sm:min-h-0 sm:py-2"
          >
            {busy ? "Creating account…" : "Sign Up"}
          </button>

          <br />

          <a
            href="/login"
            className="mt-4 block text-center font-bold text-purple-500"
          >
            Already have an account? <br />
            Login
          </a>
        </div>
      </form>
    </div>
  )
}
