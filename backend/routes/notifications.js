/**
 * Notification cron endpoint: finds upcoming events and emails users who opted in.
 */
const express = require('express');

/** Router for /api/notifications — exposes GET /send for the scheduled reminder job. */
function createNotificationsRouter({ db, callCppService, transporter }) {
  const router = express.Router();

  router.get('/send', async (req, res) => {
    try {
      const eventsResult = await callCppService('get_all_events');
      if (!eventsResult) {
        return res.json({ success: true, sent: 0 });
      }

      const now = Math.floor(Date.now() / 1000);
      let sentCount = 0;

      for (const event of eventsResult) {
        if (
          !event.notificationAttendeeIds ||
          event.notificationAttendeeIds.length === 0 ||
          event.notificationAttendeeIds.length === event.notifiedAttendeeIds.length
        ) {
          continue;
        }

        const eventTime = event.startTime;
        const notifyWindow = 10 * 60 * 6;

        if (eventTime - now <= notifyWindow && eventTime - now > 0) {
          const usersSnapshot = await db.ref('users').once('value');
          const users = usersSnapshot.val();
          let result = [];

          for (const uid of event.notificationAttendeeIds) {
            if (event.notifiedAttendeeIds.includes(uid)) continue;
            const user = users[uid];
            if (!user || !user.email) continue;

            const mailOptions = {
              from: process.env.EMAIL_USER,
              to: user.email,
              subject: `Upcoming Event: ${event.title}`,
              text: `Hi ${user.firstName || 'there'},\n\nYour event "${event.title}" starts at ${new Date(
                eventTime * 1000,
              ).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
                timeZone: 'America/New_York',
              })}.\nDon't miss it!`,
            };

            try {
              await transporter.sendMail(mailOptions);
              sentCount++;

              const notifData = {
                eventId: event.id,
                notifiedId: uid,
              };
              result = await callCppService('notification_sent', notifData);
            } catch (err) {
              console.error(`Failed to send notification to ${user.email}`, err);
            }
          }

          await db.ref(`events/${event.id}/notifiedAttendeeIds`).set(result.event.notifiedAttendeeIds);
        }
      }

      res.json({ success: true, sent: sentCount });
    } catch (err) {
      console.error('Error sending notifications:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  return router;
}

module.exports = createNotificationsRouter;
