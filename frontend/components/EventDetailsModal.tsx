'use client';

/**
 * Read-only event detail sheet: coordinator tools (edit, delete, attendee list,
 * feedback) and guest RSVP / notification toggles for upcoming or in-progress
 * events when signed in.
 */
import React, {useState, useEffect, useSyncExternalStore} from 'react';
import Link from 'next/link';
import {API_ORIGIN} from '@/lib/apiBase';
import {fetchUserById} from '@/lib/usersApi';
import {auth} from '@/lib/firebase';
import type {CalendarEvent} from '@/components/calendar/MonthView';
import type {UserProfile} from '@/components/EditProfileModal';
import ProfileFieldRow from '@/components/ProfileFieldRow';
import EventFeedbackPanel from '@/components/EventFeedbackPanel';

interface EventDetailsModalProps {
  event: CalendarEvent
  userRole: 'Event Coordinator' | 'Guest User'
  userId: string | null
  onClose: () => void
  onEdit?: () => void
  /** Called after the server deletes the event (C++ + Firebase). */
  onDeleted?: () => void
}

/**
 * Loads RSVP guest profiles for coordinators, keeps RSVP/notification UI in
 * sync, and calls backend PUT routes.
 */
export default function EventDetailsModal({
  event,
  userRole,
  userId,
  onClose,
  onEdit,
  onDeleted,
}: EventDetailsModalProps) {
  const [rsvpStatus, setRsvpStatus] = useState<boolean>(false);
  const [notificationsEnabled, setNotificationsEnabled] =
    useState<boolean>(false);
  const [attendeeRows, setAttendeeRows] = useState<
    { uid: string; displayLabel: string; profile: UserProfile }[]
  >([]);
  const [guestProfileModal, setGuestProfileModal] = useState<{
    uid: string
    profile: UserProfile
  } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    setShowDeleteConfirm(false);
    setDeleteError(null);
    setGuestProfileModal(null);
  }, [event.id]);

  /**
   * Defers RSVP/notification state from props so setState is not synchronous
   * inside the effect body.
   */
  useEffect(() => {
    const t = window.setTimeout(() => {
      if (userId && event.attendeeIds) {
        setRsvpStatus(event.attendeeIds.includes(userId));
      }
      if (userId && event.notificationAttendeeIds) {
        setNotificationsEnabled(event.notificationAttendeeIds.includes(userId));
      }
    }, 0);
    return () => window.clearTimeout(t);
  }, [event, userId]);

  useEffect(() => {
    /**
     * Loads full profile per attendee via the C++-backed user registry
     * (`GET /api/users/:id`).
     */
    const fetchAttendees = async () => {
      if (!event.attendeeIds || event.attendeeIds.length === 0) {
        setAttendeeRows([]);
        return;
      }

      try {
        const token = await auth.currentUser?.getIdToken();
        if (!token) return;
        const rows = await Promise.all(
          event.attendeeIds.map(async (uid: string) => {
            const data = await fetchUserById(uid, token);
            const displayLabel =
              `${data.firstName || ''} ${data.lastName || ''}`.trim() ||
              (typeof data.email === 'string' ? data.email : '') ||
              'Unknown user';
            return {uid, profile: data, displayLabel};
          }),
        );
        setAttendeeRows(rows);
      } catch (err) {
        console.error('Failed to fetch attendees:', err);
      }
    };
    fetchAttendees();
  }, [event]);

  /**
   * Toggles RSVP by calling the rsvp or unrsvp endpoint for the current user.
   */
  const handleRSVP = async () => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const endpoint = rsvpStatus ?
        `/api/events/${event.id}/unrsvp` :
        `/api/events/${event.id}/rsvp`;

      await fetch(`${API_ORIGIN}${endpoint}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      setRsvpStatus(!rsvpStatus);
    } catch (err) {
      console.error('RSVP toggle failed:', err);
    }
  };

  /** Enables or disables the one-hour reminder for guests who have RSVPed. */
  const handleNotificationToggle = async (checked: boolean) => {
    setNotificationsEnabled(checked);
    try {
      const token = await auth.currentUser?.getIdToken();
      await fetch(`${API_ORIGIN}/api/events/${event.id}/notifications`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({enabled: checked}),
      });
    } catch (err) {
      console.error('Notification update failed:', err);
    }
  };

  const isCoordinatorOwner =
    userRole === 'Event Coordinator' && event.coordinatorId === userId;

  /**
   * Wall clock for RSVP cutoff; external store pattern avoids impure Date.now()
   * in render.
   */
  const nowUnixSec = useSyncExternalStore(
    (onStoreChange) => {
      const id = window.setInterval(onStoreChange, 30_000);
      return () => window.clearInterval(id);
    },
    () => Math.floor(Date.now() / 1000),
    () => 0,
  );

  const eventHasEnded =
    typeof event.endTime === 'number' && nowUnixSec >= event.endTime;

  /** Deletes via backend (C++ first, then Firebase). Requires confirmation. */
  const handleConfirmDelete = async () => {
    setDeleteError(null);
    setDeleteBusy(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`${API_ORIGIN}/api/events/${event.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setDeleteError(
          typeof data.error === 'string' ?
            data.error :
            'Could not delete this event.',
        );
        return;
      }
      setShowDeleteConfirm(false);
      onDeleted?.();
    } catch (err) {
      console.error('Delete event failed:', err);
      setDeleteError('Network error — try again.');
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <div
      className={
        'fixed inset-0 z-50 flex items-center justify-center bg-black/40 ' +
        'p-3 backdrop-blur-sm sm:p-4'
      }
    >
      <div
        className={
          'relative max-h-[min(90dvh,calc(100svh-1.5rem))] w-full max-w-lg ' +
          'overflow-y-auto overscroll-contain rounded-xl bg-white px-4 ' +
          'pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-11 shadow-lg ' +
          'sm:max-h-[90vh] sm:rounded-lg sm:p-6 sm:pb-6 sm:pt-6'
        }
      >
        <button
          type="button"
          onClick={onClose}
          className={
            'absolute right-1 top-1 flex min-h-11 min-w-11 items-center ' +
            'justify-center rounded-lg text-gray-500 hover:bg-black/5 ' +
            'hover:text-gray-800 sm:right-2 sm:top-2 sm:min-h-0 sm:min-w-0 ' +
            'sm:p-1'
          }
          aria-label="Close"
        >
          ✕
        </button>

        <h2 className="text-xl font-bold mb-2">{event.title}</h2>

        <div className="text-sm mb-2">
          <span className="font-semibold">Fraternity: </span>
          {event.fraternity}
        </div>

        <div className="text-sm mb-2">
          <span className="font-semibold">Type: </span>
          {event.eventType}
        </div>

        <div className="text-sm mb-2">
          <span className="font-semibold">Date/Time: </span>
          {(() => {
            const startTime = new Date(event.startTime * 1000);
            const endTime = new Date(event.endTime * 1000);

            const optionsDate: Intl.DateTimeFormatOptions = {
              month: 'numeric',
              day: 'numeric',
              year: 'numeric',
            };

            const optionsTime: Intl.DateTimeFormatOptions = {
              hour: 'numeric',
              minute: 'numeric',
              hour12: true,
            };

            const dateStr = startTime.toLocaleDateString(
              undefined,
              optionsDate,
            );
            const startTimeStr = startTime.toLocaleTimeString(
              undefined,
              optionsTime,
            );
            const endTimeStr = endTime.toLocaleTimeString(
              undefined,
              optionsTime,
            );

            return `${dateStr}, ${startTimeStr} - ${endTimeStr}`;
          })()}
        </div>

        <div className="text-sm mb-2">
          <span className="font-semibold">Location: </span>
          {event.location || (
            <span className="text-gray-400 italic">Not provided</span>
          )}
        </div>

        <div className="text-sm mb-2">
          <span className="font-semibold">Description: </span>
          {event.description || (
            <span className="text-gray-400 italic">No description</span>
          )}
        </div>

        {event.eventType === 'Recruitment' && (
          <div className="mb-4 border-t border-black/10 pt-3 text-sm">
            <p className="mb-2 font-semibold text-neutral-900">
              Recruitment Event Details
            </p>
            <div>
              <span className="font-semibold">Formal Recruitment: </span>
              {event.isFormalRush ? 'Yes' : 'No'}
            </div>
          </div>
        )}

        {event.eventType === 'Philanthropy' && (
          <div className="mb-4 border-t border-black/10 pt-3 text-sm">
            <p className="mb-2 font-semibold text-neutral-900">
              Philanthropy Event Details
            </p>
            <div className="mb-1">
              <span className="font-semibold">Beneficiary: </span>
              {event.beneficiary?.trim() ?? ''}
            </div>
            <div>
              <span className="font-semibold">Fundraising Goal: </span>
              {new Intl.NumberFormat(undefined, {
                style: 'currency',
                currency: 'USD',
              }).format(
                typeof event.fundraisingGoal === 'number' ?
                  event.fundraisingGoal :
                  Number(event.fundraisingGoal),
              )}
            </div>
          </div>
        )}

        {event.eventType === 'Social' && (
          <div className="mb-4 border-t border-black/10 pt-3 text-sm">
            <p className="mb-2 font-semibold text-neutral-900">
              Social Event Details
            </p>
            <div className="mb-1">
              <span className="font-semibold">Formal Event: </span>
              {event.isFormal ? 'Yes' : 'No'}
            </div>
            <div className="mb-1">
              <span className="font-semibold">Has Alcohol: </span>
              {event.hasAlcohol ? 'Yes' : 'No'}
            </div>
            <div>
              <span className="font-semibold">Maximum Capacity: </span>
              {typeof event.maxCapacity === 'number' ?
                event.maxCapacity :
                Number(event.maxCapacity)}
            </div>
          </div>
        )}

        {userRole === 'Guest User' &&
          userId &&
          event.coordinatorId &&
          event.coordinatorId !== userId && (
            <div className="mb-4">
              <Link
                href={`/chat?peer=${encodeURIComponent(event.coordinatorId)}`}
                className={
                  'block w-full rounded-lg bg-blue-600 px-4 py-2.5 ' +
                  'text-center text-sm font-medium text-white hover:bg-blue-700'
                }
              >
                Send message to event coordinator
              </Link>
            </div>
          )}

        {isCoordinatorOwner && (
          <>
            {!eventHasEnded && (
              <>
                <button
                  onClick={onEdit}
                  className={
                    'mb-2 w-full rounded bg-blue-500 px-4 py-2 text-white ' +
                    'hover:bg-blue-600'
                  }
                >
                  Edit Event
                </button>
                {!showDeleteConfirm ? (
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteError(null);
                      setShowDeleteConfirm(true);
                    }}
                    className={
                      'mb-2 w-full rounded bg-red-600 px-4 py-2 text-white ' +
                      'hover:bg-red-700'
                    }
                  >
                    Delete Event
                  </button>
                ) : (
                  <div
                    className="mb-3 rounded border border-red-200 bg-red-50 p-3"
                  >
                    <p className="mb-2 text-sm text-neutral-800">
                      Delete this event permanently? This cannot be undone.
                    </p>
                    {deleteError && (
                      <p className="mb-2 text-sm text-red-700">{deleteError}</p>
                    )}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={deleteBusy}
                        onClick={() => {
                          setShowDeleteConfirm(false);
                          setDeleteError(null);
                        }}
                        className={
                          'flex-1 rounded border border-neutral-300 bg-white ' +
                          'px-3 py-2 text-sm hover:bg-neutral-50 ' +
                          'disabled:opacity-50'
                        }
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={deleteBusy}
                        onClick={handleConfirmDelete}
                        className={
                          'flex-1 rounded bg-red-600 px-3 py-2 text-sm ' +
                          'text-white hover:bg-red-700 disabled:opacity-50'
                        }
                      >
                        {deleteBusy ? 'Deleting…' : 'Delete Permanently'}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
            {eventHasEnded && (
              <p className="mb-2 text-sm text-neutral-600">
                This event has ended — editing is no longer available.
              </p>
            )}

            <div className="text-sm mb-2">
              <span className="font-semibold">RSVPs: </span>
              {(event.attendeeCount ?? 0) === 0 && '0 people'}
              {(event.attendeeCount ?? 0) === 1 && '1 person'}
              {(event.attendeeCount ?? 0) > 1 &&
                `${event.attendeeCount} people`}
            </div>

            {attendeeRows.length > 0 && (
              <div
                className={
                  'mt-2 max-h-40 overflow-y-auto overscroll-contain rounded ' +
                  'border text-sm'
                }
              >
                <ul className="divide-y divide-black/10">
                  {attendeeRows.map((a) => (
                    <li key={a.uid}>
                      <button
                        type="button"
                        onClick={() =>
                          setGuestProfileModal({uid: a.uid, profile: a.profile})
                        }
                        className={
                          'w-full px-2 py-2 text-left text-blue-700 ' +
                          'underline decoration-blue-300 underline-offset-2 ' +
                          'hover:bg-blue-50'
                        }
                      >
                        {a.displayLabel}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {eventHasEnded && (
              <EventFeedbackPanel mode="coordinator" eventId={event.id} show />
            )}
          </>
        )}

        {userRole === 'Guest User' && !eventHasEnded && userId && (
          <>
            <button
              onClick={handleRSVP}
              className={
                'w-full rounded py-2 text-white ' +
                (rsvpStatus ?
                  'bg-red-500 hover:bg-red-600' :
                  'bg-green-500 hover:bg-green-600')
              }
            >
              {rsvpStatus ? 'Withdraw RSVP' : 'RSVP'}
            </button>

            {rsvpStatus && (
              <label className="flex items-center gap-2 mt-3 text-sm">
                <input
                  type="checkbox"
                  checked={notificationsEnabled}
                  onChange={(e) => handleNotificationToggle(e.target.checked)}
                />
                Notify me 1 hour before
              </label>
            )}
          </>
        )}

        {userRole === 'Guest User' && !eventHasEnded && !userId && (
          <p className="text-sm text-neutral-600">Please log in to RSVP.</p>
        )}

        {userRole === 'Guest User' && eventHasEnded && !userId && (
          <p className="text-sm text-neutral-600">This event has ended.</p>
        )}

        {userRole === 'Guest User' && eventHasEnded && userId && (
          <>
            <p className="text-sm text-neutral-600">
              This event has ended
              {rsvpStatus ? ' — you RSVP\'d.' : ' — you did not RSVP.'}
            </p>
            {rsvpStatus && (
              <EventFeedbackPanel mode="guest" eventId={event.id} show />
            )}
          </>
        )}
      </div>

      {guestProfileModal && isCoordinatorOwner && (
        <div
          className={
            'fixed inset-0 z-[60] flex items-center justify-center ' +
            'bg-black/40 p-3 backdrop-blur-sm'
          }
          role="dialog"
          aria-modal="true"
          aria-labelledby="guest-profile-title"
          onClick={() => setGuestProfileModal(null)}
        >
          <div
            className={
              'max-h-[min(90dvh,100svh)] w-full max-w-md overflow-y-auto ' +
              'overscroll-contain rounded-xl bg-white px-4 py-4 shadow-lg'
            }
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-start justify-between gap-2">
              <h3
                id="guest-profile-title"
                className="text-lg font-semibold text-neutral-900"
              >
                Guest Profile
              </h3>
              <button
                type="button"
                onClick={() => setGuestProfileModal(null)}
                className={
                  'shrink-0 rounded-lg p-2 text-gray-500 hover:bg-black/5 ' +
                  'hover:text-gray-800'
                }
                aria-label="Close guest profile"
              >
                ✕
              </button>
            </div>
            <div className="flex flex-col gap-2 border-b border-black/10 pb-3">
              <ProfileFieldRow
                label="First name"
                value={guestProfileModal.profile.firstName}
              />
              <ProfileFieldRow
                label="Last name"
                value={guestProfileModal.profile.lastName}
              />
              <ProfileFieldRow
                label="Email"
                value={guestProfileModal.profile.email}
              />
              <ProfileFieldRow
                label="Class year"
                value={guestProfileModal.profile.classYear}
              />
              <ProfileFieldRow
                label="Major"
                value={guestProfileModal.profile.major}
              />
              <ProfileFieldRow
                label="Interests"
                value={guestProfileModal.profile.interests}
              />
              <ProfileFieldRow
                label="Role"
                value={guestProfileModal.profile.role}
              />
            </div>
            {guestProfileModal.uid !== userId && (
              <div className="mt-4 flex justify-end">
                <Link
                  href={`/chat?peer=${encodeURIComponent(
                    guestProfileModal.uid,
                  )}`}
                  className={
                    'rounded-lg bg-blue-600 px-4 py-2.5 text-center text-sm ' +
                    'font-medium text-white hover:bg-blue-700'
                  }
                >
                  Send message
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
