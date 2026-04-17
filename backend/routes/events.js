/**
 * Event API: list, read, create, update, delete, RSVP, and notification preferences;
 * persists to Firebase and delegates business rules to the C++ calendar service.
 */
const express = require('express');

/** Normalize stored start/end to Unix seconds (ISO string or numeric epoch seconds/ms). */
function eventTimeToUnix(value) {
  if (value == null) return null;
  if (typeof value === 'number' && !Number.isNaN(value)) {
    return value > 1e12 ? Math.floor(value / 1000) : value;
  }
  const t = new Date(value).getTime();
  return Number.isNaN(t) ? null : Math.floor(t / 1000);
}

/**
 * True if [aStart, aEnd) overlaps [bStart, bEnd) in time; touching endpoints do not overlap.
 */
function intervalsOverlapUnix(aStart, aEnd, bStart, bEnd) {
  if (aStart == null || aEnd == null || bStart == null || bEnd == null) return false;
  if (aEnd <= aStart || bEnd <= bStart) return false;
  return aStart < bEnd && bStart < aEnd;
}

/**
 * Finds a same-fraternity time overlap using the in-memory C++ calendar (get_all_events), not Firebase.
 * Keeps conflict detection on the hot path used for API reads and avoids an extra DB round-trip.
 */
async function findFraternityTimeConflict(callCppService, { fraternity, startUnix, endUnix, excludeEventId }) {
  if (!fraternity || startUnix == null || endUnix == null || endUnix <= startUnix) {
    return null;
  }

  const all = await callCppService('get_all_events');
  if (!Array.isArray(all)) {
    return null;
  }

  for (const ev of all) {
    if (!ev || typeof ev !== 'object') continue;
    const id = ev.id;
    if (excludeEventId && id === excludeEventId) continue;
    if (ev.fraternity !== fraternity) continue;

    const s = eventTimeToUnix(ev.startTime);
    const e = eventTimeToUnix(ev.endTime);
    if (s == null || e == null || e <= s) continue;

    if (intervalsOverlapUnix(startUnix, endUnix, s, e)) {
      return { id, title: ev.title || 'Untitled event' };
    }
  }
  return null;
}

/** Feedback only after the event has ended (inverse of RSVP window). */
async function rejectIfEventNotEnded(callCppService, eventId) {
  const ev = await callCppService('get_event', { id: eventId });
  if (ev.error) {
    return { message: 'Event not found', status: 404 };
  }
  const endUnix = eventTimeToUnix(ev.endTime);
  if (endUnix == null) {
    return { message: 'Invalid event', status: 400 };
  }
  const nowSec = Math.floor(Date.now() / 1000);
  if (nowSec < endUnix) {
    return { message: 'Feedback is only available after the event has ended', status: 403 };
  }
  return null;
}

/**
 * Blocks RSVP / un-RSVP / notification toggles after the event end (authoritative via C++ get_event).
 */
async function rejectIfEventEnded(callCppService, eventId) {
  const ev = await callCppService('get_event', { id: eventId });
  if (ev.error) {
    return { message: 'Event not found', status: 404 };
  }
  const endUnix = eventTimeToUnix(ev.endTime);
  if (endUnix == null) {
    return { message: 'Invalid event', status: 400 };
  }
  const nowSec = Math.floor(Date.now() / 1000);
  if (nowSec >= endUnix) {
    return { message: 'This event has already ended', status: 403 };
  }
  return null;
}

/** Express router for /api/events — coordinates Firebase and callCppService for each operation. */
function createEventsRouter({ db, authenticate, callCppService, convertEventDates }) {
  const router = express.Router();

  router.get('/', async (req, res) => {
    try {
      const result = await callCppService('get_all_events');
      res.json(result);
    } catch (error) {
      console.error('Error getting events:', error);
      res.status(500).json({ error: error.message });
    }
  });

  router.get('/coordinator/:coordinatorId', async (req, res) => {
    try {
      const result = await callCppService('get_events_by_coordinator', {
        coordinatorId: req.params.coordinatorId,
      });
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get('/:id', async (req, res) => {
    try {
      const result = await callCppService('get_event', { id: req.params.id });

      if (result.error) {
        return res.status(404).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('Error getting event:', error);
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/', authenticate, async (req, res) => {
    try {
      const userResult = await callCppService('get_user', { id: req.user.uid });
      const userData = userResult.error ? {} : userResult;
      if (userData.role !== 'Event Coordinator') {
        return res.status(403).json({ error: 'Only event coordinators can create events' });
      }

      const fraternity = userData.fraternity || null;
      if (!fraternity) {
        return res.status(400).json({ error: 'Your profile must include a fraternity to host events' });
      }

      const eventData = {
        ...req.body,
        coordinatorId: req.user.uid,
        fraternity,
        id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };

      const convertedEvent = convertEventDates(eventData);

      const conflict = await findFraternityTimeConflict(callCppService, {
        fraternity,
        startUnix: convertedEvent.startTime,
        endUnix: convertedEvent.endTime,
        excludeEventId: null,
      });
      if (conflict) {
        return res.status(409).json({
          error: `Your fraternity already has an event that overlaps this time: "${conflict.title}"`,
          code: 'FRATERNITY_TIME_OVERLAP',
          conflictingEvent: { id: conflict.id, title: conflict.title },
        });
      }

      console.log(convertedEvent);

      const result = await callCppService('create_event', convertedEvent);

      if (result.error) {
        return res.status(400).json(result);
      }

      await db.ref(`events/${eventData.id}`).set(eventData);

      res.json(result);
    } catch (error) {
      console.error('Error creating event:', error);
      res.status(500).json({ error: error.message });
    }
  });

  router.put('/:id', authenticate, async (req, res) => {
    try {
      const userResult = await callCppService('get_user', { id: req.user.uid });
      const userData = userResult.error ? {} : userResult;
      if (userData.role !== 'Event Coordinator') {
        return res.status(403).json({ error: 'Only event coordinators can edit events' });
      }

      const fraternity = userData.fraternity || null;
      if (!fraternity) {
        return res.status(400).json({ error: 'Your profile must include a fraternity to edit events' });
      }

      const existingResult = await callCppService('get_event', { id: req.params.id });
      if (existingResult.error) {
        return res.status(404).json({ error: 'Event not found' });
      }
      const existing = existingResult;
      if (existing.fraternity !== fraternity) {
        return res.status(403).json({ error: 'You can only edit events hosted by your fraternity' });
      }

      const endUnix = eventTimeToUnix(existing.endTime);
      const nowSec = Math.floor(Date.now() / 1000);
      if (endUnix != null && nowSec >= endUnix) {
        return res.status(403).json({ error: 'Cannot edit an event that has already ended' });
      }

      const eventData = {
        ...req.body,
        coordinatorId: req.user.uid,
        fraternity,
        id: req.params.id,
      };

      const convertedEvent = convertEventDates(eventData);

      const conflict = await findFraternityTimeConflict(callCppService, {
        fraternity,
        startUnix: convertedEvent.startTime,
        endUnix: convertedEvent.endTime,
        excludeEventId: req.params.id,
      });
      if (conflict) {
        return res.status(409).json({
          error: `Your fraternity already has an event that overlaps this time: "${conflict.title}"`,
          code: 'FRATERNITY_TIME_OVERLAP',
          conflictingEvent: { id: conflict.id, title: conflict.title },
        });
      }

      console.log(convertedEvent);

      const result = await callCppService('update_event', convertedEvent);

      if (result.error) {
        return res.status(400).json(result);
      }

      await db.ref(`events/${eventData.id}`).update(eventData);

      res.json(result);
    } catch (error) {
      console.error('Error updating event:', error);
      res.status(500).json({ error: error.message });
    }
  });

  router.delete('/:id', authenticate, async (req, res) => {
    try {
      const eventId = req.params.id;

      const userResult = await callCppService('get_user', { id: req.user.uid });
      const userData = userResult.error ? {} : userResult;
      if (userData.role !== 'Event Coordinator') {
        return res.status(403).json({ error: 'Only event coordinators can delete events' });
      }

      const fraternity = userData.fraternity || null;
      if (!fraternity) {
        return res.status(400).json({ error: 'Your profile must include a fraternity' });
      }

      const existingResult = await callCppService('get_event', { id: eventId });
      if (existingResult.error) {
        return res.status(404).json({ error: 'Event not found' });
      }
      const existing = existingResult;
      if (existing.coordinatorId !== req.user.uid) {
        return res.status(403).json({ error: 'Only the hosting coordinator can delete this event' });
      }
      if (existing.fraternity !== fraternity) {
        return res.status(403).json({ error: 'You can only delete events hosted by your fraternity' });
      }

      const endUnix = eventTimeToUnix(existing.endTime);
      const nowSec = Math.floor(Date.now() / 1000);
      if (endUnix != null && nowSec >= endUnix) {
        return res.status(403).json({ error: 'Cannot delete an event that has already ended' });
      }

      const result = await callCppService('delete_event', { id: eventId });

      if (result.error) {
        return res.status(400).json(result);
      }

      if (result.success) {
        await db.ref(`events/${eventId}`).remove();
        await db.ref(`eventFeedback/${eventId}`).remove();
      }

      res.json(result);
    } catch (error) {
      console.error('Error deleting event:', error);
      res.status(500).json({ error: error.message });
    }
  });

  router.put('/:id/rsvp', authenticate, async (req, res) => {
    try {
      const ended = await rejectIfEventEnded(callCppService, req.params.id);
      if (ended) {
        return res.status(ended.status).json({ error: ended.message });
      }

      console.log('handling rsvp');
      const rsvpData = {
        eventId: req.params.id,
        attendeeId: req.user.uid,
      };

      console.log(rsvpData);

      const result = await callCppService('add_attendee', rsvpData);

      if (result.error) {
        return res.status(400).json(result);
      }

      await db.ref(`events/${req.params.id}/attendeeIds`).set(result.event.attendeeIds);

      res.json(result);
    } catch (error) {
      console.error('Error updating event:', error);
      res.status(500).json({ error: error.message });
    }
  });

  router.put('/:id/unrsvp', authenticate, async (req, res) => {
    try {
      const ended = await rejectIfEventEnded(callCppService, req.params.id);
      if (ended) {
        return res.status(ended.status).json({ error: ended.message });
      }

      console.log('handling unrsvp');
      const rsvpData = {
        eventId: req.params.id,
        attendeeId: req.user.uid,
      };

      const result = await callCppService('remove_attendee', rsvpData);

      if (result.error) {
        return res.status(400).json(result);
      }

      await db.ref(`events/${req.params.id}/attendeeIds`).set(result.event.attendeeIds);

      res.json(result);
    } catch (error) {
      console.error('Error updating event:', error);
      res.status(500).json({ error: error.message });
    }
  });

  router.put('/:id/notifications', authenticate, async (req, res) => {
    try {
      const ended = await rejectIfEventEnded(callCppService, req.params.id);
      if (ended) {
        return res.status(ended.status).json({ error: ended.message });
      }

      const { enabled } = req.body;

      const payload = {
        eventId: req.params.id,
        attendeeId: req.user.uid,
        enabled,
      };

      console.log(payload);

      const result = await callCppService('toggle_notification', payload);
      if (result.error) {
        return res.status(400).json(result);
      }

      await db.ref(`events/${req.params.id}/notificationAttendeeIds`).set(result.event.notificationAttendeeIds);

      res.json(result);
    } catch (error) {
      console.error('Error updating event:', error);
      res.status(500).json({ error: error.message });
    }
  });

  const FEEDBACK_PATH = (eventId) => `eventFeedback/${eventId}`;
  const MAX_COMMENT_LEN = 2000;

  /** GET: coordinator — C++ aggregate + rows; guest — C++ myFeedback only (Firebase not used for reads). */
  router.get('/:id/feedback', authenticate, async (req, res) => {
    try {
      const eventId = req.params.id;
      const ev = await callCppService('get_event', { id: eventId });
      if (ev.error) {
        return res.status(404).json({ error: 'Event not found' });
      }

      const uid = req.user.uid;
      const isOwner = ev.coordinatorId === uid;

      if (isOwner) {
        const cpp = await callCppService('get_event_feedback_coordinator', { eventId });
        if (cpp.error) {
          return res.status(404).json(cpp);
        }
        return res.json(cpp);
      }

      const userSnap = await db.ref(`users/${uid}`).once('value');
      const profile = userSnap.val() || {};
      if (profile.role !== 'Guest User') {
        return res.status(403).json({ error: 'Only guests who attended can view personal feedback' });
      }

      const attendeeIds = Array.isArray(ev.attendeeIds) ? ev.attendeeIds : [];
      if (!attendeeIds.includes(uid)) {
        return res.status(403).json({ error: 'Only guests who RSVP\'d can access feedback' });
      }

      const cpp = await callCppService('get_event_feedback_guest', { eventId, userId: uid });
      if (cpp.error) {
        return res.status(404).json(cpp);
      }
      return res.json(cpp);
    } catch (error) {
      console.error('Error reading feedback:', error);
      res.status(500).json({ error: error.message });
    }
  });

  /** PUT: validate guest + RSVP + ended, then C++ upsert; Firebase mirrors after success. */
  router.put('/:id/feedback', authenticate, async (req, res) => {
    try {
      const eventId = req.params.id;
      const notEnded = await rejectIfEventNotEnded(callCppService, eventId);
      if (notEnded) {
        return res.status(notEnded.status).json({ error: notEnded.message });
      }

      const ev = await callCppService('get_event', { id: eventId });
      if (ev.error) {
        return res.status(404).json({ error: 'Event not found' });
      }

      const uid = req.user.uid;
      const userSnap = await db.ref(`users/${uid}`).once('value');
      const profile = userSnap.val() || {};
      if (profile.role !== 'Guest User') {
        return res.status(403).json({ error: 'Only guest users can submit feedback' });
      }

      const attendeeIds = Array.isArray(ev.attendeeIds) ? ev.attendeeIds : [];
      if (!attendeeIds.includes(uid)) {
        return res.status(403).json({ error: 'You must have RSVP\'d to leave feedback' });
      }

      const { vote, comment } = req.body || {};
      if (vote !== 'up' && vote !== 'down') {
        return res.status(400).json({ error: 'vote must be "up" or "down"' });
      }

      let text = typeof comment === 'string' ? comment.trim() : '';
      if (text.length > MAX_COMMENT_LEN) {
        return res.status(400).json({ error: `Comment must be at most ${MAX_COMMENT_LEN} characters` });
      }

      const cpp = await callCppService('upsert_event_feedback', {
        eventId,
        userId: uid,
        vote,
        comment: text,
      });

      if (cpp.error || !cpp.success) {
        return res.status(400).json(cpp.error ? cpp : { error: 'Failed to save feedback in calendar service' });
      }

      const payload = cpp.feedback;
      await db.ref(`${FEEDBACK_PATH(eventId)}/${uid}`).set(payload);

      res.json({ success: true, feedback: payload });
    } catch (error) {
      console.error('Error saving feedback:', error);
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}

module.exports = createEventsRouter;
