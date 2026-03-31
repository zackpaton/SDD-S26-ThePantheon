"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { onAuthStateChanged, User } from "firebase/auth"
import { auth } from "@/lib/firebase"

const baseNavItems = [
  { name: "Calendar", path: "/calendar" },
  { name: "Events", path: "/events" },
  { name: "Chat", path: "/chat" },
  { name: "Settings", path: "/settings" },
]

export default function Navbar() {
  const pathname = usePathname()

  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // Prevent UI flicker while Firebase loads auth state
  if (loading) return null

  const navItems = [
    ...baseNavItems,
    user
      ? { name: "Profile", path: "/profile" }
      : { name: "Login", path: "/login" },
  ]

  return (
    <nav className="w-full border-b bg-purple-500">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/calendar" className="text-xl font-semibold">
          Greeked Out
        </Link>

        {/* Nav Links */}
        <div className="flex gap-6">
          {navItems.map((item) => {
            const isActive = pathname === item.path

            return (
              <Link
                key={item.name}
                href={item.path}
                className={`text-sm font-medium transition-colors ${
                  isActive
                    ? "text-white"
                    : "text-black hover:text-blue-500"
                }`}
              >
                {item.name}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}