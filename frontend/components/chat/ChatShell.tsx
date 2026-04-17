"use client"

/**
 * Mac-style Messages layout: conversation list + active thread; Firebase RTDB listeners when configured.
 */
import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { onAuthStateChanged, type User } from "firebase/auth"
import { onValue, ref } from "firebase/database"
import type { UserProfile } from "@/components/EditProfileModal"
import ProfileFieldRow from "@/components/ProfileFieldRow"
import { API_ORIGIN } from "@/lib/apiBase"
import { fetchUserById } from "@/lib/usersApi"
import { auth, database } from "@/lib/firebase"

type ConversationRow = {
  chatId: string
  peerUid: string
  peerName?: string
  peerEmail?: string | null
  updatedAt?: number
  lastMessageText?: string
  lastMessageSenderId?: string | null
}

type ChatMessage = {
  id: string
  senderId: string
  text: string
  createdAt?: number
}

type LookupUser = {
  uid: string
  email: string
  displayName: string
  firstName?: string
  lastName?: string
}

function formatSidebarTime(ts?: number) {
  if (ts == null || Number.isNaN(ts)) return ""
  const d = new Date(ts)
  const now = new Date()
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  if (sameDay) {
    return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
  }
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return (parts[0]![0] + parts[parts.length - 1]![0]).toUpperCase()
}

/** Full-height two-pane chat UI backed by `/api/chats` and optional Realtime Database listeners. */
export default function ChatShell() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [user, setUser] = useState<User | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [conversations, setConversations] = useState<ConversationRow[]>([])
  const [activeChatId, setActiveChatId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [compose, setCompose] = useState("")
  const [sending, setSending] = useState(false)
  const [emailQuery, setEmailQuery] = useState("")
  const [lookupCandidate, setLookupCandidate] = useState<LookupUser | null>(null)
  const [lookupError, setLookupError] = useState<string | null>(null)
  const [lookupBusy, setLookupBusy] = useState(false)
  const [openBusy, setOpenBusy] = useState(false)
  /** Until the conversation list includes the active thread (e.g. right after opening via link). */
  const [peerUidUntilConvLoads, setPeerUidUntilConvLoads] = useState<string | null>(null)
  const [peerProfileOpen, setPeerProfileOpen] = useState(false)
  const [peerProfile, setPeerProfile] = useState<UserProfile | null>(null)
  const [peerProfileLoading, setPeerProfileLoading] = useState(false)
  const [peerProfileError, setPeerProfileError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      setUser(u)
      setAuthReady(true)
    })
    return () => unsub()
  }, [])

  const fetchConversationsRest = useCallback(async (u: User) => {
    const token = await u.getIdToken()
    const res = await fetch(`${API_ORIGIN}/api/chats`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return
    const data = await res.json()
    const rows: ConversationRow[] = data.conversations || []
    setConversations(rows)
  }, [])

  /** Opens or resumes a direct chat with `peerUid` (REST); updates sidebar when RTDB is off. */
  const openChatWithPeerUid = useCallback(
    async (
      peerUid: string,
    ): Promise<{ ok: boolean; chatId?: string; error?: string }> => {
      if (!user || peerUid === user.uid) {
        return { ok: false, error: "You cannot open a chat with yourself." }
      }
      const token = await user.getIdToken()
      const res = await fetch(`${API_ORIGIN}/api/chats/open`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ peerUid }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        return {
          ok: false,
          error:
            typeof data.error === "string" ? data.error : "Could not open chat.",
        }
      }
      const chatId = data.chatId as string
      setPeerUidUntilConvLoads(peerUid)
      setActiveChatId(chatId)
      if (!database) void fetchConversationsRest(user)
      return { ok: true, chatId }
    },
    [user, fetchConversationsRest, database],
  )

  useEffect(() => {
    if (!user) {
      setConversations([])
      setActiveChatId(null)
      return
    }

    if (database) {
      const r = ref(database, `userConversations/${user.uid}`)
      const unsub = onValue(r, snap => {
        const val = snap.val() as Record<string, Omit<ConversationRow, "chatId">> | null
        if (!val) {
          setConversations([])
          return
        }
        const rows: ConversationRow[] = Object.entries(val).map(([chatId, row]) => ({
          chatId,
          ...row,
        }))
        rows.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
        setConversations(rows)
      })
      return () => unsub()
    }

    void fetchConversationsRest(user)
    const id = window.setInterval(() => void fetchConversationsRest(user), 6000)
    return () => window.clearInterval(id)
  }, [user, fetchConversationsRest])

  const fetchMessagesRest = useCallback(async (u: User, chatId: string) => {
    const token = await u.getIdToken()
    const res = await fetch(
      `${API_ORIGIN}/api/chats/${encodeURIComponent(chatId)}/messages`,
      { headers: { Authorization: `Bearer ${token}` } },
    )
    if (!res.ok) return
    const data = await res.json()
    setMessages(data.messages || [])
  }, [])

  useEffect(() => {
    if (!user || !activeChatId) {
      setMessages([])
      return
    }

    if (database) {
      const r = ref(database, `directChats/${activeChatId}/messages`)
      const unsub = onValue(r, snap => {
        const val = snap.val() as Record<string, Omit<ChatMessage, "id">> | null
        if (!val) {
          setMessages([])
          return
        }
        const arr: ChatMessage[] = Object.entries(val).map(([id, m]) => ({
          id,
          senderId: m.senderId,
          text: m.text,
          createdAt: m.createdAt,
        }))
        arr.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
        setMessages(arr)
      })
      return () => unsub()
    }

    void fetchMessagesRest(user, activeChatId)
    const id = window.setInterval(() => void fetchMessagesRest(user, activeChatId), 3500)
    return () => window.clearInterval(id)
  }, [user, activeChatId, fetchMessagesRest])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, activeChatId])

  const handleLookup = async () => {
    if (!user) return
    setLookupError(null)
    setLookupCandidate(null)
    const q = emailQuery.trim().toLowerCase()
    if (!q) {
      setLookupError("Enter an email address.")
      return
    }
    setLookupBusy(true)
    try {
      const token = await user.getIdToken()
      const res = await fetch(
        `${API_ORIGIN}/api/chats/lookup?email=${encodeURIComponent(q)}`,
        { headers: { Authorization: `Bearer ${token}` } },
      )
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setLookupError(typeof data.error === "string" ? data.error : "User not found.")
        return
      }
      setLookupCandidate({
        uid: data.uid,
        email: data.email,
        displayName: data.displayName || `${data.firstName || ""} ${data.lastName || ""}`.trim() || data.email,
        firstName: data.firstName,
        lastName: data.lastName,
      })
    } catch {
      setLookupError("Network error — try again.")
    } finally {
      setLookupBusy(false)
    }
  }

  const handleOpenChat = async () => {
    if (!user || !lookupCandidate) return
    setOpenBusy(true)
    setLookupError(null)
    try {
      const { ok, error } = await openChatWithPeerUid(lookupCandidate.uid)
      if (!ok) {
        setLookupError(error || "Could not open chat.")
        return
      }
      setLookupCandidate(null)
      setEmailQuery("")
    } catch {
      setLookupError("Network error — try again.")
    } finally {
      setOpenBusy(false)
    }
  }

  // Deep link: /chat?peer=<uid> (e.g. from event RSVP guest profile).
  useEffect(() => {
    const peerUid = searchParams.get("peer")
    if (!peerUid || !user) return
    if (peerUid === user.uid) {
      router.replace("/chat", { scroll: false })
      return
    }
    let cancelled = false
    void (async () => {
      await openChatWithPeerUid(peerUid)
      if (cancelled) return
      router.replace("/chat", { scroll: false })
    })()
    return () => {
      cancelled = true
    }
  }, [user, searchParams, router, openChatWithPeerUid])

  const handleSend = async () => {
    if (!user || !activeChatId) return
    const text = compose.trim()
    if (!text) return
    setSending(true)
    try {
      const token = await user.getIdToken()
      const res = await fetch(
        `${API_ORIGIN}/api/chats/${encodeURIComponent(activeChatId)}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ text }),
        },
      )
      if (res.ok) setCompose("")
    } catch (e) {
      console.error(e)
    } finally {
      setSending(false)
    }
  }

  useEffect(() => {
    if (!activeChatId) setPeerUidUntilConvLoads(null)
  }, [activeChatId])

  useEffect(() => {
    if (!activeChatId) return
    const c = conversations.find(x => x.chatId === activeChatId)
    if (c?.peerUid) setPeerUidUntilConvLoads(null)
  }, [activeChatId, conversations])

  useEffect(() => {
    setPeerProfileOpen(false)
  }, [activeChatId])

  const activeConv = conversations.find(c => c.chatId === activeChatId)
  const threadPeerUid = activeConv?.peerUid ?? peerUidUntilConvLoads
  const activeTitle = activeConv?.peerName || activeConv?.peerEmail || "Conversation"

  const openPeerProfile = async () => {
    if (!user || !threadPeerUid) return
    setPeerProfileOpen(true)
    setPeerProfile(null)
    setPeerProfileError(null)
    setPeerProfileLoading(true)
    try {
      const token = await user.getIdToken()
      const data = await fetchUserById(threadPeerUid, token)
      setPeerProfile(data)
    } catch {
      setPeerProfileError("Could not load profile.")
    } finally {
      setPeerProfileLoading(false)
    }
  }

  if (!authReady) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-neutral-600">
        Loading…
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
        <p className="text-neutral-700">Please log in to send and receive chats.</p>
        <Link
          href="/login"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Login
        </Link>
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-black/10 bg-white shadow-sm md:flex-row">
      {/* Sidebar — conversation list + new chat (full width on phone until a chat is open) */}
      <aside
        className={`flex w-full shrink-0 flex-col border-black/10 bg-[#f5f5f7] md:w-[min(100%,320px)] md:border-r ${
          activeChatId ? "hidden md:flex" : "flex"
        }`}
      >
        <div className="border-b border-black/10 px-3 py-3">
          <h1 className="text-lg font-semibold text-neutral-900">Messages</h1>
          <p className="mt-0.5 text-xs text-neutral-500">Search by email to start a chat</p>
          <div className="mt-2 flex gap-1">
            <input
              type="email"
              placeholder="user@example.com"
              value={emailQuery}
              onChange={e => setEmailQuery(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter") void handleLookup()
              }}
              className="min-w-0 flex-1 rounded-md border border-black/15 bg-white px-2 py-2 text-base outline-none focus:ring-2 focus:ring-blue-500 sm:py-1.5 sm:text-sm"
            />
            <button
              type="button"
              disabled={lookupBusy}
              onClick={() => void handleLookup()}
              className="shrink-0 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {lookupBusy ? "…" : "Find"}
            </button>
          </div>
          {lookupError && <p className="mt-1 text-xs text-red-600">{lookupError}</p>}
          {lookupCandidate && (
            <div className="mt-2 rounded-lg border border-black/10 bg-white p-2 shadow-sm">
              <div className="text-sm font-medium text-neutral-900">{lookupCandidate.displayName}</div>
              <div className="text-xs text-neutral-500">{lookupCandidate.email}</div>
              <button
                type="button"
                disabled={openBusy}
                onClick={() => void handleOpenChat()}
                className="mt-2 w-full rounded-md bg-blue-600 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {openBusy ? "Opening…" : "Start chat"}
              </button>
            </div>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <p className="px-3 py-4 text-center text-sm text-neutral-500">No conversations yet</p>
          ) : (
            <ul className="divide-y divide-black/5">
              {conversations.map(c => {
                const title = c.peerName || c.peerEmail || "User"
                const active = c.chatId === activeChatId
                return (
                  <li key={c.chatId}>
                    <button
                      type="button"
                      onClick={() => setActiveChatId(c.chatId)}
                      className={`flex w-full items-start gap-2 px-3 py-2.5 text-left transition-colors ${
                        active ? "bg-blue-500/15" : "hover:bg-black/5"
                      }`}
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
                        {initials(title)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-1">
                          <span className="truncate text-sm font-semibold text-neutral-900">{title}</span>
                          <span className="shrink-0 text-[11px] text-neutral-400">
                            {formatSidebarTime(c.updatedAt)}
                          </span>
                        </div>
                        <p className="truncate text-xs text-neutral-500">
                          {c.lastMessageText || "No messages yet"}
                        </p>
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </aside>

      {/* Thread */}
      <section
        className={`flex min-h-0 min-w-0 flex-1 flex-col bg-white ${
          !activeChatId ? "hidden md:flex" : "flex"
        }`}
      >
        {!activeChatId ? (
          <div className="flex flex-1 flex-col items-center justify-center px-4 text-center text-neutral-500">
            <p className="text-sm">Select a conversation or find someone by email</p>
          </div>
        ) : (
          <>
            <header className="flex shrink-0 flex-col border-b border-black/10 px-3 pb-3 pt-3 sm:px-4">
              <div className="flex items-center">
                <button
                  type="button"
                  aria-label="Back to conversations"
                  className="mr-2 flex min-h-10 min-w-10 shrink-0 items-center justify-center rounded-lg text-lg text-neutral-700 hover:bg-black/5 md:hidden"
                  onClick={() => setActiveChatId(null)}
                >
                  ←
                </button>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
                  {initials(activeTitle)}
                </div>
                <div className="ml-3 min-w-0">
                  <h2 className="truncate text-base font-semibold text-neutral-900">{activeTitle}</h2>
                  {activeConv?.peerEmail && (
                    <p className="truncate text-xs text-neutral-500">{activeConv.peerEmail}</p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => void openPeerProfile()}
                disabled={!threadPeerUid}
                className="mt-2 w-full rounded-lg border border-black/15 bg-purple-400 px-3 py-2 text-sm font-medium text-neutral-900 hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                View profile
              </button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto bg-[#e8e8ed] px-3 py-3">
              <div className="mx-auto flex max-w-3xl flex-col gap-2">
                {messages.length === 0 ? (
                  <p className="py-8 text-center text-sm text-neutral-500">No messages yet — say hello.</p>
                ) : (
                  messages.map(m => {
                    const mine = m.senderId === user.uid
                    return (
                      <div
                        key={m.id}
                        className={`flex ${mine ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-[18px] px-3 py-2 text-sm shadow-sm ${
                            mine
                              ? "rounded-br-md bg-[#007aff] text-white"
                              : "rounded-bl-md bg-white text-neutral-900"
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{m.text}</p>
                          <p
                            className={`mt-1 text-right text-[10px] ${
                              mine ? "text-white/80" : "text-neutral-400"
                            }`}
                          >
                            {m.createdAt
                              ? new Date(m.createdAt).toLocaleTimeString(undefined, {
                                  hour: "numeric",
                                  minute: "2-digit",
                                })
                              : ""}
                          </p>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            <footer className="shrink-0 border-t border-black/10 bg-white/90 px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur">
              <div className="mx-auto flex max-w-3xl items-end gap-2">
                <textarea
                  value={compose}
                  onChange={e => setCompose(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      void handleSend()
                    }
                  }}
                  placeholder="Message"
                  rows={1}
                  className="max-h-32 min-h-[44px] flex-1 resize-y rounded-xl border border-black/15 bg-white px-3 py-2.5 text-base outline-none focus:ring-2 focus:ring-blue-500 sm:min-h-[40px] sm:py-2 sm:text-sm"
                />
                <button
                  type="button"
                  disabled={sending || !compose.trim()}
                  onClick={() => void handleSend()}
                  className="min-h-[44px] shrink-0 rounded-full bg-[#007aff] px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-40 sm:min-h-0"
                >
                  Send
                </button>
              </div>
            </footer>
          </>
        )}
      </section>

      {peerProfileOpen && user && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-3 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="peer-profile-title"
          onClick={() => setPeerProfileOpen(false)}
        >
          <div
            className="max-h-[min(90dvh,100svh)] w-full max-w-md overflow-y-auto overscroll-contain rounded-xl bg-white px-4 py-4 shadow-lg"
            onClick={e => e.stopPropagation()}
          >
            <div className="mb-3 flex items-start justify-between gap-2">
              <h3 id="peer-profile-title" className="text-lg font-semibold text-neutral-900">
                {peerProfileLoading
                  ? "Profile"
                  : `${peerProfile?.firstName || ""} ${peerProfile?.lastName || ""}`.trim() ||
                    activeTitle ||
                    "Profile"}
              </h3>
              <button
                type="button"
                onClick={() => setPeerProfileOpen(false)}
                className="shrink-0 rounded-lg p-2 text-gray-500 hover:bg-black/5 hover:text-gray-800"
                aria-label="Close profile"
              >
                ✕
              </button>
            </div>
            {peerProfileLoading && (
              <p className="text-sm text-neutral-600">Loading profile…</p>
            )}
            {peerProfileError && (
              <p className="text-sm text-red-600">{peerProfileError}</p>
            )}
            {!peerProfileLoading && !peerProfileError && peerProfile && (
              <div className="flex flex-col gap-2">
                <ProfileFieldRow label="First name" value={peerProfile.firstName} />
                <ProfileFieldRow label="Last name" value={peerProfile.lastName} />
                <ProfileFieldRow label="Email" value={peerProfile.email} />
                <ProfileFieldRow label="Class year" value={peerProfile.classYear} />
                <ProfileFieldRow label="Major" value={peerProfile.major} />
                <ProfileFieldRow label="Interests" value={peerProfile.interests} />
                <ProfileFieldRow label="Role" value={peerProfile.role} />
                {peerProfile.role === "Event Coordinator" && (
                  <ProfileFieldRow label="Fraternity" value={peerProfile.fraternity} />
                )}
              </div>
            )}
            {!peerProfileLoading && !peerProfileError && !peerProfile && (
              <p className="text-sm text-neutral-600">No profile details available.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
