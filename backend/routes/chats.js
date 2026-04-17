/**
 * Direct (1:1) chat API: lookup by email via Firebase Auth, open threads in Realtime Database, send messages.
 * Chat bodies live under `directChats/{chatId}`; per-user inbox under `userConversations/{uid}/{chatId}`.
 */
const express = require('express');

const MAX_MESSAGE_LEN = 4000;

function normalizeEmail(e) {
  return (e || '').trim().toLowerCase();
}

/** Deterministic id for a pair of Firebase uids (order-independent). */
function makeChatId(uidA, uidB) {
  const [a, b] = [uidA, uidB].sort();
  return `${a}:${b}`;
}

function parseChatId(chatId) {
  const i = chatId.indexOf(':');
  if (i <= 0) return null;
  return [chatId.slice(0, i), chatId.slice(i + 1)];
}

function isParticipant(chatId, uid) {
  const parts = parseChatId(chatId);
  if (!parts) return false;
  return parts[0] === uid || parts[1] === uid;
}

async function getUserDisplayMeta(db, uid) {
  const snap = await db.ref(`users/${uid}`).once('value');
  const p = snap.val() || {};
  const name = [p.firstName, p.lastName].filter(Boolean).join(' ').trim();
  return {
    displayName: name || p.email || 'User',
    email: p.email || null,
  };
}

function previewText(text) {
  const t = text.trim();
  if (t.length <= 120) return t;
  return `${t.slice(0, 117)}...`;
}

/** Express router mounted at /api/chats. */
function createChatsRouter({ db, authenticate, admin }) {
  const router = express.Router();

  /** Find a registered user by email (Firebase Auth) and return public profile fields. */
  router.get('/lookup', authenticate, async (req, res) => {
    try {
      const email = normalizeEmail(req.query.email);
      if (!email) {
        return res.status(400).json({ error: 'email query parameter is required' });
      }

      let peerAuth;
      try {
        peerAuth = await admin.auth().getUserByEmail(email);
      } catch (e) {
        if (e.code === 'auth/user-not-found') {
          return res.status(404).json({ error: 'No user with that email' });
        }
        throw e;
      }

      if (peerAuth.uid === req.user.uid) {
        return res.status(400).json({ error: 'You cannot start a chat with yourself' });
      }

      const snap = await db.ref(`users/${peerAuth.uid}`).once('value');
      const p = snap.val() || {};
      const displayName =
        [p.firstName, p.lastName].filter(Boolean).join(' ').trim() || p.email || 'User';

      res.json({
        uid: peerAuth.uid,
        email: peerAuth.email || email,
        firstName: p.firstName || '',
        lastName: p.lastName || '',
        displayName,
        role: p.role || '',
      });
    } catch (err) {
      console.error('chat lookup:', err);
      res.status(500).json({ error: 'Lookup failed' });
    }
  });

  /** Create or return an existing direct chat with `peerUid` and sync inbox rows. */
  router.post('/open', authenticate, async (req, res) => {
    try {
      const { peerUid } = req.body || {};
      if (!peerUid || typeof peerUid !== 'string') {
        return res.status(400).json({ error: 'peerUid is required' });
      }
      if (peerUid === req.user.uid) {
        return res.status(400).json({ error: 'Invalid peer' });
      }

      try {
        await admin.auth().getUser(peerUid);
      } catch (e) {
        if (e.code === 'auth/user-not-found') {
          return res.status(404).json({ error: 'User not found' });
        }
        throw e;
      }

      const uid = req.user.uid;
      const chatId = makeChatId(uid, peerUid);
      const metaRef = db.ref(`directChats/${chatId}/meta`);
      const metaSnap = await metaRef.once('value');

      const selfMeta = await getUserDisplayMeta(db, uid);
      const peerMeta = await getUserDisplayMeta(db, peerUid);
      const now = Date.now();
      const isNew = !metaSnap.exists();

      if (isNew) {
        await metaRef.set({
          participants: { [uid]: true, [peerUid]: true },
          updatedAt: now,
          lastMessageText: '',
          lastMessageSenderId: null,
        });
      }

      const inboxFor = (peer) => {
        const base = {
          peerUid: peer.uid,
          peerName: peer.displayName,
          peerEmail: peer.email,
        };
        if (isNew) {
          return {
            ...base,
            updatedAt: now,
            lastMessageText: '',
            lastMessageSenderId: null,
          };
        }
        return base;
      };

      await db.ref(`userConversations/${uid}/${chatId}`).update(
        inboxFor({ uid: peerUid, displayName: peerMeta.displayName, email: peerMeta.email }),
      );

      await db.ref(`userConversations/${peerUid}/${chatId}`).update(
        inboxFor({ uid, displayName: selfMeta.displayName, email: selfMeta.email }),
      );

      res.json({
        chatId,
        peer: {
          uid: peerUid,
          displayName: peerMeta.displayName,
          email: peerMeta.email,
        },
      });
    } catch (err) {
      console.error('chat open:', err);
      res.status(500).json({ error: 'Failed to open chat' });
    }
  });

  /** List the current user's conversations (newest activity first). */
  router.get('/', authenticate, async (req, res) => {
    try {
      const snap = await db.ref(`userConversations/${req.user.uid}`).once('value');
      const val = snap.val() || {};
      const rows = Object.entries(val).map(([chatId, row]) => {
        if (!row || typeof row !== 'object') {
          return null;
        }
        return { chatId, ...row };
      }).filter(Boolean);

      for (const row of rows) {
        if (!row.peerName && row.peerUid) {
          const m = await getUserDisplayMeta(db, row.peerUid);
          row.peerName = m.displayName;
          row.peerEmail = row.peerEmail || m.email;
        }
      }

      rows.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
      res.json({ conversations: rows });
    } catch (err) {
      console.error('chat list:', err);
      res.status(500).json({ error: 'Failed to list chats' });
    }
  });

  /** Load full message history for a chat (polling fallback if the client has no RTDB listener). */
  router.get('/:chatId/messages', authenticate, async (req, res) => {
    try {
      const { chatId } = req.params;
      if (!isParticipant(chatId, req.user.uid)) {
        return res.status(403).json({ error: 'Not a participant in this chat' });
      }
      const snap = await db.ref(`directChats/${chatId}/messages`).once('value');
      const val = snap.val() || {};
      const messages = Object.entries(val).map(([id, m]) => ({
        id,
        ...(typeof m === 'object' && m ? m : {}),
      }));
      messages.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
      res.json({ messages });
    } catch (err) {
      console.error('chat get messages:', err);
      res.status(500).json({ error: 'Failed to load messages' });
    }
  });

  /** Append a message to a direct chat (C++ service not used). */
  router.post('/:chatId/messages', authenticate, async (req, res) => {
    try {
      const { chatId } = req.params;
      const uid = req.user.uid;

      if (!isParticipant(chatId, uid)) {
        return res.status(403).json({ error: 'Not a participant in this chat' });
      }

      const textRaw = req.body && typeof req.body.text === 'string' ? req.body.text : '';
      const text = textRaw.trim();
      if (!text) {
        return res.status(400).json({ error: 'Message cannot be empty' });
      }
      if (text.length > MAX_MESSAGE_LEN) {
        return res.status(400).json({ error: `Message must be at most ${MAX_MESSAGE_LEN} characters` });
      }

      const metaSnap = await db.ref(`directChats/${chatId}/meta`).once('value');
      if (!metaSnap.exists()) {
        return res.status(404).json({ error: 'Chat not found' });
      }

      const now = Date.now();
      const pv = previewText(text);

      const msgRef = db.ref(`directChats/${chatId}/messages`).push();
      await msgRef.set({
        senderId: uid,
        text,
        createdAt: now,
      });

      await db.ref(`directChats/${chatId}/meta`).update({
        updatedAt: now,
        lastMessageText: pv,
        lastMessageSenderId: uid,
      });

      const parts = parseChatId(chatId);
      if (!parts) {
        return res.status(400).json({ error: 'Invalid chat id' });
      }
      const [a, b] = parts;

      await db.ref(`userConversations/${a}/${chatId}`).update({
        updatedAt: now,
        lastMessageText: pv,
        lastMessageSenderId: uid,
      });
      await db.ref(`userConversations/${b}/${chatId}`).update({
        updatedAt: now,
        lastMessageText: pv,
        lastMessageSenderId: uid,
      });

      res.json({
        success: true,
        messageId: msgRef.key,
        createdAt: now,
      });
    } catch (err) {
      console.error('chat message:', err);
      res.status(500).json({ error: 'Failed to send message' });
    }
  });

  return router;
}

module.exports = createChatsRouter;
