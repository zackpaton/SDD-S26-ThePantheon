// Keep all your existing requires and setup
const express = require('express');
const admin = require('firebase-admin');
const { spawn } = require('child_process');
const cors = require('cors');
const path = require('path');
const nodemailer = require('nodemailer');
const next = require('next'); // ✅ added for Next.js handling
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// ------------------- Next.js Setup -------------------
const dev = process.env.NODE_ENV !== 'production';
const nextApp = next({ dev, dir: path.join(__dirname, '../frontend') });
const handle = nextApp.getRequestHandler();

// Initialize Firebase Admin SDK
const serviceAccount = require('./serviceAccountKey.json');

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DB_URL
});

const db = admin.database();

app.use(cors());
app.use(express.json());

// Path to C++ executable
const CPP_EXECUTABLE = path.join(__dirname, '../cpp-service/build/calendar_service');

const cpp = spawn(CPP_EXECUTABLE);

cpp.stderr.on('data', (data) => {
  console.error('C++ Error:', data.toString());
});

let pendingResolvers = [];

cpp.stdout.on('data', (data) => {
  const lines = data.toString().trim().split('\n');

  lines.forEach((line) => {
    if (!line) return;

    try {
      const result = JSON.parse(line);
      const resolve = pendingResolvers.shift();
      if (resolve) resolve(result);
    } catch (err) {
      console.error('Invalid JSON from C++:', line);
    }
  });
});

/**
 * Call C++ service for business logic operations
 */
function callCppService(command, data = null) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ command, data });

    pendingResolvers.push(resolve);

    cpp.stdin.write(payload + '\n', (err) => {
      if (err) {
        pendingResolvers.pop();
        reject(err);
      }
    });
  });
}

/**
 * Load all events from Firebase and sync with C++ service
 */
async function loadEventsToCppService() {
  try {
    const snapshot = await db.ref('events').once('value');
    const eventsData = snapshot.val();

    //console.log(eventsData);
    
    if (!eventsData) {
      return { success: true, count: 0 };
    }
    
    // Convert Firebase object to array
    const eventsArray = Object.values(eventsData)
      .map(event => convertEventDates(event)); // ✅ convert dates here

    console.log(eventsArray);
    
    // Load into C++ service
    const result = await callCppService('load_events', { events: eventsArray });
    console.log(result);
    return result;
  } catch (error) {
    console.error('Error loading events to C++ service:', error);
    throw error;
  }
}

function getEasternISO(date) {
  return date.toLocaleString("sv-SE", {
    timeZone: "America/New_York",
    hour12: false
  }).replace(" ", "T") + "-04:00"; // EDT offset
}

// Helper to convert ISO string dates to Unix timestamps
function convertEventDates(event) {
  return {
    ...event,
    date: event.date ? Math.floor(new Date(event.date).getTime() / 1000) : null,
    startTime: event.startTime ? Math.floor(new Date(event.startTime).getTime() / 1000) : null,
    endTime: event.endTime ? Math.floor(new Date(event.endTime).getTime() / 1000) : null
  };
}

async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" })
  }

  const token = authHeader.split("Bearer ")[1]

  try {
    const decoded = await admin.auth().verifyIdToken(token)
    req.user = decoded // contains uid, email, etc.
    next()
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" })
  }
}

app.get('/api/users/:uid', authenticate, async (req, res) => {
  try {
    const snapshot = await db.ref(`users/${req.params.uid}`).once('value')
    const userData = snapshot.val()

    res.json(userData || {})
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Failed to fetch user" })
  }
})

app.post('/api/users', async (req, res) => {
  try {
    const { uid, ...data } = req.body
    await db.ref(`users/${uid}`).set(data)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: "Failed to create user" })
  }
})

// Update user profile
app.put('/api/users/:uid', authenticate, async (req, res) => {
  try {
    const { uid } = req.params

    // Optional: ensure the user can only update their own profile
    if (req.user.uid !== uid) {
      return res.status(403).json({ error: "Unauthorized to edit this profile" })
    }

    const updates = req.body

    // Update only the fields provided in the request body
    await db.ref(`users/${uid}`).update(updates)

    // Return the updated user
    const snapshot = await db.ref(`users/${uid}`).once('value')
    const updatedUser = snapshot.val()

    res.json(updatedUser)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Failed to update user" })
  }
})

// Get multiple users at once (BATCH)
app.post('/api/users/batch', async (req, res) => {
  try {
    const { uids } = req.body

    if (!uids || !Array.isArray(uids)) {
      return res.status(400).json({ error: "uids must be an array" })
    }

    const results = await Promise.all(
      uids.map(async (uid) => {
        const snapshot = await db.ref(`users/${uid}`).once('value')
        return {
          uid,
          ...snapshot.val()
        }
      })
    )

    res.json(results)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Failed to fetch users batch" })
  }
})

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'fraternity-calendar-api' });
});

// ==================== EVENT CRUD ====================

// Get all events
app.get('/api/events', async (req, res) => {
  try {
    const result = await callCppService('get_all_events');
    //console.log(result);
    res.json(result);
  } catch (error) {
    console.error('Error getting events:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get single event
app.get('/api/events/:id', async (req, res) => {
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

// Create event
app.post('/api/events', authenticate, async (req, res) => {
  try {
    // 1️⃣ Generate ID
    const eventData = {
      ...req.body,
      coordinatorId: req.user.uid,
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };


    // 2️⃣ Convert dates ONLY for C++ (Unix timestamps)
    const convertedEvent = convertEventDates(eventData);

    console.log(convertedEvent);

    // 3️⃣ Send to C++ service
    const result = await callCppService('create_event', convertedEvent);

    if (result.error) {
      return res.status(400).json(result);
    }

    // 4️⃣ Save ORIGINAL (ISO strings) to Firebase
    await db.ref(`events/${eventData.id}`).set(eventData);

    // 5️⃣ Return response
    res.json(result);

  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update event
app.put('/api/events/:id', authenticate, async (req, res) => {
  try {
    
    const eventData = {
      ...req.body,
      coordinatorId: req.user.uid,
      id: req.params.id
    };
    
    const convertedEvent = convertEventDates(eventData);

    console.log(convertedEvent);

    // 3️⃣ Send to C++ service
    const result = await callCppService('create_event', convertedEvent);
    
    if (result.error) {
      //console.log(res.status(400).json(result));
      return res.status(400).json(result);
    }
    
    // Update in Firebase
    await db.ref(`events/${eventData.id}`).update(eventData);
    
    res.json(result);
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete event
app.delete('/api/events/:id', async (req, res) => {
  try {
    
    const result = await callCppService('delete_event', { id: req.params.id });
    
    if (result.success) {
      await db.ref(`events/${req.params.id}`).remove();
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ error: error.message });
  }
});


app.put('/api/events/:id/rsvp', authenticate, async (req, res) => {
  try {
    console.log("handling rsvp");
    const rsvpData = {
      eventId: req.params.id,
      attendeeId: req.user.uid
    };

    const result = await callCppService('add_attendee', rsvpData);
    
    if (result.error) {
      //console.log(res.status(400).json(result));
      return res.status(400).json(result);
    }

    // Update in Firebase
    await db.ref(`events/${req.params.id}/attendeeIds`).set(result.event.attendeeIds);
    
    res.json(result);
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ error: error.message });
  }
})


app.put('/api/events/:id/unrsvp', authenticate, async (req, res) => {
  try {
    console.log("handling unrsvp");
    const rsvpData = {
      eventId: req.params.id,
      attendeeId: req.user.uid
    };

    const result = await callCppService('remove_attendee', rsvpData);
    
    if (result.error) {
      //console.log(res.status(400).json(result));
      return res.status(400).json(result);
    }

    // Update in Firebase
    await db.ref(`events/${req.params.id}/attendeeIds`).set(result.event.attendeeIds);
    
    res.json(result);
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ error: error.message });
  }
})


app.put('/api/events/:id/notifications', authenticate, async (req, res) => {
  try {
    const { enabled } = req.body

    const payload = {
      eventId: req.params.id,
      userId: req.user.uid,
      enabled: enabled
    }

    const result = await callCppService('toggle_notification', payload)
    res.json(result)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Failed to update notifications" })
  }
})




app.get('/api/events/coordinator/:coordinatorId', async (req, res) => {
  try {
    const result = await callCppService('get_events_by_coordinator', { 
      coordinatorId: req.params.coordinatorId 
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== STATISTICS ====================

app.get('/api/statistics', async (req, res) => {
  try {
    const result = await callCppService('get_statistics');
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});




// ------------------- Next.js Catch-All for non-API routes -------------------
nextApp.prepare().then(() => {
  // Replace your old static serving code with this
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
      await loadEventsToCppService();
      console.log("✅ Initial events loaded into C++ service");
    } catch (err) {
      console.error("❌ Failed initial load:", err);
    }
  });
});
