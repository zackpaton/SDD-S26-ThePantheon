/**
 * Statistics API: exposes aggregate calendar metrics computed in the C++ service.
 */
const express = require('express');

/** Router for /api/statistics — forwards get_statistics to the native engine. */
function createStatisticsRouter({ callCppService }) {
  const router = express.Router();

  router.get('/', async (req, res) => {
    try {
      const result = await callCppService('get_statistics');
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}

module.exports = createStatisticsRouter;
