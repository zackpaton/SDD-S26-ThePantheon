/**
 * HTTP server entry point: Express API for users, events, notifications, and statistics;
 * proxies calendar logic to the C++ child process; serves the Next.js frontend for non-API routes.
 */
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const next = require('next');

const { admin, db } = require('./lib/firebase');
const { createTransporter } = require('./lib/email');
const {
  CPP_EXECUTABLE,
  callCppService,
  convertEventDates,
  loadUsersToCppService,
  loadEventsToCppService,
  loadEventFeedbackToCppService,
} = require('./lib/cppClient');
const { authenticate } = require('./lib/authenticate');
const createUsersRouter = require('./routes/users');
const createEventsRouter = require('./routes/events');
const createNotificationsRouter = require('./routes/notifications');
const createStatisticsRouter = require('./routes/statistics');
const createChatsRouter = require('./routes/chats');

const app = express();
const PORT = process.env.PORT || 3001;

const dev = process.env.NODE_ENV !== 'production';
const nextApp = next({ dev, dir: path.join(__dirname, '../frontend') });
const handle = nextApp.getRequestHandler();

const transporter = createTransporter();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'fraternity-calendar-api' });
});

app.use('/api/users', createUsersRouter({ db, authenticate, callCppService }));
app.use('/api/chats', createChatsRouter({ db, authenticate, admin }));
app.use(
  '/api/events',
  createEventsRouter({
    db,
    authenticate,
    callCppService,
    convertEventDates,
  }),
);
app.use(
  '/api/notifications',
  createNotificationsRouter({
    db,
    callCppService,
    transporter,
  }),
);
app.use(
  '/api/statistics',
  createStatisticsRouter({
    callCppService,
  }),
);

nextApp.prepare().then(() => {
  app.get('/{*path}', (req, res) => {
    if (req.path.startsWith('/api')) {
      return res.status(404).send('API route not found');
    }
    return handle(req, res);
  });

  app.listen(PORT, async () => {
    console.log(`🚀 Fraternity Calendar API running on port ${PORT}`);
    console.log(`📁 C++ service path: ${CPP_EXECUTABLE}`);

    try {
      await loadUsersToCppService();
      console.log('✅ Initial users loaded into C++ service');
      await loadEventsToCppService();
      console.log('✅ Initial events loaded into C++ service');
      await loadEventFeedbackToCppService();
      console.log('✅ Initial event feedback loaded into C++ service');
    } catch (err) {
      console.error('❌ Failed initial load:', err);
    }
  });
});
