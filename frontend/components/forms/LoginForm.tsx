"use client"

import { useState } from "react"
import { signInWithEmailAndPassword } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { useRouter } from "next/navigation"

export default function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const router = useRouter()

  const handleLogin = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const token = await userCredential.user.getIdToken()

      console.log("✅ Logged in:", userCredential.user)
      console.log("🔥 Token:", token)

      // redirect after login
      router.push("/calendar")
    } catch (err) {
      console.error("❌ Login error:", err)
    }
  }

  return (
    <div className="flex items-center justify-center h-screen">
      <form
        className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4"
        onSubmit={(e) => e.preventDefault()}
      >
        <div className="mb-4">
          <input
            className="shadow border rounded w-full py-2 px-3 text-gray-700"
            type="email"
            placeholder="Email"
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="mb-6">
          <input
            className="shadow border rounded w-full py-2 px-3 text-gray-700"
            type="password"
            placeholder="Password"
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div>
          <button
            onClick={handleLogin}
            className="w-full bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 rounded"
          >
            Login
          </button>

          <a className="block text-right text-purple-500 mt-2">
            Forgot Password?
          </a>

          <br />

          <a
            href="/sign-up"
            className="block font-bold text-center text-purple-500"
          >
            Don't have an account? <br />Sign up
          </a>
        </div>
      </form>
    </div>
  )
}