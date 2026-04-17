"use client"

/**
 * Post-event feedback: guests submit up/down + comment; coordinators see totals and RSVP guest comments.
 */
import { useCallback, useEffect, useState } from "react"
import { auth } from "@/lib/firebase"

const API_BASE = "http://localhost:3001"

export type CoordinatorFeedbackPayload = {
  role: "coordinator"
  upvotes: number
  downvotes: number
  entries: {
    userId: string
    displayName: string
    vote: "up" | "down"
    comment: string
    updatedAt: number
  }[]
}

export type GuestFeedbackPayload = {
  role: "guest"
  myFeedback: {
    vote: "up" | "down"
    comment: string
    updatedAt: number
  } | null
}

type Props = {
  mode: "coordinator" | "guest"
  eventId: string
  /** When false, panel does not render and internal state resets. */
  show: boolean
}

export default function EventFeedbackPanel(props: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [coordinatorData, setCoordinatorData] = useState<CoordinatorFeedbackPayload | null>(null)
  const [myFeedback, setMyFeedback] = useState<GuestFeedbackPayload["myFeedback"]>(null)
  const [draftVote, setDraftVote] = useState<"up" | "down" | null>(null)
  const [draftComment, setDraftComment] = useState("")
  const [saving, setSaving] = useState(false)

  const { show } = props

  const loadCoordinator = useCallback(async () => {
    const token = await auth.currentUser?.getIdToken()
    if (!token) return
    const res = await fetch(`${API_BASE}/api/events/${props.eventId}/feedback`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || "Failed to load feedback")
    if (data.role !== "coordinator") throw new Error("Unexpected response")
    setCoordinatorData(data)
  }, [props.eventId])

  const loadGuest = useCallback(async () => {
    const token = await auth.currentUser?.getIdToken()
    if (!token) return
    const res = await fetch(`${API_BASE}/api/events/${props.eventId}/feedback`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || "Failed to load feedback")
    if (data.role !== "guest") throw new Error("Unexpected response")
    const mf = data.myFeedback
    setMyFeedback(mf)
    if (mf) {
      setDraftVote(mf.vote)
      setDraftComment(mf.comment)
    } else {
      setDraftVote(null)
      setDraftComment("")
    }
  }, [props.eventId])

  useEffect(() => {
    if (!show) {
      setCoordinatorData(null)
      setMyFeedback(null)
      setDraftVote(null)
      setDraftComment("")
      setError(null)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)
    if (props.mode === "coordinator") {
      setCoordinatorData(null)
    }
    const run = async () => {
      try {
        if (props.mode === "coordinator") {
          await loadCoordinator()
        } else {
          await loadGuest()
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load feedback")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [show, props.mode, props.eventId, loadCoordinator, loadGuest])

  const saveGuestFeedback = async () => {
    if (props.mode !== "guest" || !draftVote) return
    setSaving(true)
    setError(null)
    try {
      const token = await auth.currentUser?.getIdToken()
      const res = await fetch(`${API_BASE}/api/events/${props.eventId}/feedback`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ vote: draftVote, comment: draftComment }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Failed to save")
      const fb = data.feedback
      if (fb) {
        setMyFeedback({
          vote: fb.vote,
          comment: fb.comment || "",
          updatedAt: fb.updatedAt,
        })
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  if (!show) return null

  if (props.mode === "coordinator") {
    return (
      <div className="mt-4 border-t border-neutral-200 pt-3">
        <h3 className="mb-2 text-sm font-semibold text-neutral-900">Guest feedback</h3>
        {loading && <p className="text-sm text-neutral-500">Loading feedback…</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {!loading && coordinatorData && (
          <>
            <div className="mb-3 flex gap-4 text-sm">
              <span>
                <span className="font-semibold text-green-700">↑ Upvotes:</span>{" "}
                {coordinatorData.upvotes}
              </span>
              <span>
                <span className="font-semibold text-red-700">↓ Downvotes:</span>{" "}
                {coordinatorData.downvotes}
              </span>
            </div>
            {coordinatorData.entries.length === 0 ? (
              <p className="text-sm text-neutral-500">No feedback submitted yet.</p>
            ) : (
              <ul className="max-h-48 space-y-2 overflow-y-auto rounded border border-neutral-200 bg-neutral-50 p-2 text-sm">
                {coordinatorData.entries.map((row) => (
                  <li key={row.userId} className="rounded bg-white p-2 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-1">
                      <span className="font-medium text-neutral-800">{row.displayName}</span>
                      <span
                        className={
                          row.vote === "up"
                            ? "text-xs font-semibold text-green-700"
                            : "text-xs font-semibold text-red-700"
                        }
                      >
                        {row.vote === "up" ? "Upvoted" : "Downvoted"}
                      </span>
                    </div>
                    {row.comment ? (
                      <p className="mt-1 whitespace-pre-wrap text-neutral-700">{row.comment}</p>
                    ) : (
                      <p className="mt-1 text-xs italic text-neutral-400">No comment</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    )
  }

  return (
    <div className="mt-4 border-t border-neutral-200 pt-3">
      <h3 className="mb-2 text-sm font-semibold text-neutral-900">Rate this event</h3>
      <p className="mb-2 text-xs text-neutral-600">
        Share how it went (one vote per person; you can update your feedback anytime).
      </p>
      {loading && <p className="text-sm text-neutral-500">Loading…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!loading && (
        <>
          <div className="mb-2 flex gap-2">
            <button
              type="button"
              onClick={() => setDraftVote("up")}
              className={`flex-1 rounded border-2 px-3 py-2 text-sm font-medium transition-colors ${
                draftVote === "up"
                  ? "border-green-600 bg-green-50 text-green-900"
                  : "border-neutral-300 bg-white hover:bg-neutral-50"
              }`}
            >
              ↑ Upvote
            </button>
            <button
              type="button"
              onClick={() => setDraftVote("down")}
              className={`flex-1 rounded border-2 px-3 py-2 text-sm font-medium transition-colors ${
                draftVote === "down"
                  ? "border-red-600 bg-red-50 text-red-900"
                  : "border-neutral-300 bg-white hover:bg-neutral-50"
              }`}
            >
              ↓ Downvote
            </button>
          </div>
          <label className="mb-1 block text-xs font-medium text-neutral-700">Comment (optional)</label>
          <textarea
            value={draftComment}
            onChange={(e) => setDraftComment(e.target.value)}
            rows={3}
            maxLength={2000}
            className="mb-2 w-full rounded border border-neutral-300 px-2 py-1.5 text-sm"
            placeholder="What did you think?"
          />
          <button
            type="button"
            disabled={!draftVote || saving}
            onClick={() => void saveGuestFeedback()}
            className="w-full rounded bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving…" : myFeedback ? "Update feedback" : "Save feedback"}
          </button>
        </>
      )}
    </div>
  )
}
