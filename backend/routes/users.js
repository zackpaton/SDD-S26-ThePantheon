/**
 * User profile API: reads from the C++ user registry; writes update C++ first,
 * then Firebase.
 */
const express = require('express');
const {Router: createExpressRouter} = express;

/** Omits internal-only fields from C++ JSON before sending to clients. */
function sanitizeUserForClient(u) {
  if (!u || typeof u !== 'object' || u.error) return {};
  const {userKind: _userKind, ...rest} = u;
  return rest;
}

/**
 * Express router mounted at /api/users (get by uid, create, update, batch).
 */
function createUsersRouter({db, authenticate, callCppService}) {
  const router = createExpressRouter();

  router.get('/:uid', authenticate, async (req, res) => {
    try {
      const result = await callCppService('get_user', {id: req.params.uid});

      if (result.error) {
        return res.json({});
      }

      res.json(sanitizeUserForClient(result));
    } catch (err) {
      console.error(err);
      res.status(500).json({error: 'Failed to fetch user'});
    }
  });

  router.post('/', async (req, res) => {
    try {
      const {uid, ...data} = req.body;
      if (!uid) {
        return res.status(400).json({error: 'uid required'});
      }

      const cppPayload = {id: uid, ...data};
      const cppResult = await callCppService('upsert_user', cppPayload);

      if (cppResult.error || !cppResult.success) {
        return res.status(400).json(
            cppResult.error ?
              cppResult :
              {error: 'Failed to persist user in calendar service'},
        );
      }

      await db.ref(`users/${uid}`).set(data);
      res.json({success: true});
    } catch (err) {
      console.error(err);
      res.status(500).json({error: 'Failed to create user'});
    }
  });

  router.put('/:uid', authenticate, async (req, res) => {
    try {
      const {uid} = req.params;

      if (req.user.uid !== uid) {
        return res.status(403).json({
          error: 'Unauthorized to edit this profile',
        });
      }

      const current = await callCppService('get_user', {id: uid});
      const base = current && !current.error ? current : {};
      const merged = {...base, ...req.body, id: uid};

      const cppResult = await callCppService('upsert_user', merged);

      if (cppResult.error || !cppResult.success) {
        return res.status(400).json(
            cppResult.error ?
              cppResult :
              {error: 'Failed to persist user in calendar service'},
        );
      }

      const out = cppResult.user || merged;
      const {userKind: _userKind2, id: _dropId, ...firebasePayload} = out;
      await db.ref(`users/${uid}`).update(firebasePayload);

      res.json(sanitizeUserForClient(out));
    } catch (err) {
      console.error(err);
      res.status(500).json({error: 'Failed to update user'});
    }
  });

  router.post('/batch', async (req, res) => {
    try {
      const {uids} = req.body;

      if (!uids || !Array.isArray(uids)) {
        return res.status(400).json({error: 'uids must be an array'});
      }

      const rows = await callCppService('get_users_batch', {uids});

      if (!Array.isArray(rows)) {
        return res.status(500).json({error: 'Invalid batch response'});
      }

      const results = rows.map((row) => sanitizeUserForClient(row));
      res.json(results);
    } catch (err) {
      console.error(err);
      res.status(500).json({error: 'Failed to fetch users batch'});
    }
  });

  return router;
}

module.exports = createUsersRouter;
