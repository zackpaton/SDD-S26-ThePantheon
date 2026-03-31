const express = require('express');
const admin = require('firebase-admin');
const { spawn } = require('child_process');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Firebase Admin SDK
const serviceAccount = require('./serviceAccountKey.json');

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
    const eventsArray = Object.values(eventsData);

    //console.log(eventsArray);
    
    // Load into C++ service
    const result = await callCppService('load_events', { events: eventsArray });
    console.log(result);
    return result;
  } catch (error) {
    console.error('Error loading events to C++ service:', error);
    throw error;
  }
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'fraternity-calendar-api' });
});

// ==================== EVENT CRUD ====================

// Get all events
app.get('/api/events', async (req, res) => {
  try {
    await loadEventsToCppService();
    const result = await callCppService('get_all_events');
    console.log(result);
    res.json(result);
  } catch (error) {
    console.error('Error getting events:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get single event
app.get('/api/events/:id', async (req, res) => {
  try {
    await loadEventsToCppService();
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
app.post('/api/events', async (req, res) => {
  try {
    // Generate ID
    const eventData = {
      ...req.body,
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
    
    // Validate and process with C++ service
    const result = await callCppService('create_event', eventData);
    
    if (result.error) {
      return res.status(400).json(result);
    }
    
    // Save to Firebase
    await db.ref(`events/${eventData.id}`).set(result.event);
    
    res.json(result);
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update event
app.put('/api/events/:id', async (req, res) => {
  try {
    await loadEventsToCppService();
    
    const eventData = {
      ...req.body,
      id: req.params.id
    };
    
    const result = await callCppService('update_event', eventData);
    
    if (result.error) {
      return res.status(400).json(result);
    }
    
    // Update in Firebase
    await db.ref(`events/${req.params.id}`).update(result.event);
    
    res.json(result);
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete event
app.delete('/api/events/:id', async (req, res) => {
  try {
    await loadEventsToCppService();
    
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

// ==================== EVENT TYPE QUERIES ====================

app.get('/api/events/type/recruitment', async (req, res) => {
  try {
    await loadEventsToCppService();
    const result = await callCppService('get_recruitment_events');
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/events/type/philanthropy', async (req, res) => {
  try {
    await loadEventsToCppService();
    const result = await callCppService('get_philanthropy_events');
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/events/type/social', async (req, res) => {
  try {
    await loadEventsToCppService();
    const result = await callCppService('get_social_events');
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== FILTERING ====================

app.get('/api/events/filter/location/:location', async (req, res) => {
  try {
    await loadEventsToCppService();
    const result = await callCppService('filter_by_location', { 
      location: req.params.location 
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/events/filter/date-range', async (req, res) => {
  try {
    await loadEventsToCppService();
    const { start, end } = req.query;
    const result = await callCppService('filter_by_date_range', { 
      start: parseInt(start), 
      end: parseInt(end) 
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/events/upcoming', async (req, res) => {
  try {
    await loadEventsToCppService();
    const result = await callCppService('get_upcoming_events');
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/events/public', async (req, res) => {
  try {
    await loadEventsToCppService();
    const result = await callCppService('get_public_events');
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/events/coordinator/:coordinatorId', async (req, res) => {
  try {
    await loadEventsToCppService();
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
    await loadEventsToCppService();
    const result = await callCppService('get_statistics');
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== RECRUITMENT SPECIFIC ====================

app.get('/api/events/rush-round/:round', async (req, res) => {
  try {
    await loadEventsToCppService();
    const result = await callCppService('get_events_by_rush_round', { 
      round: req.params.round 
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/events/:eventId/invite-pnm', async (req, res) => {
  try {
    await loadEventsToCppService();
    const result = await callCppService('add_pnm_to_event', {
      eventId: req.params.eventId,
      pnmId: req.body.pnmId
    });
    
    if (result.success) {
      await db.ref(`events/${req.params.eventId}`).update(result.event);
    }
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/events/:eventId/record-attendance', async (req, res) => {
  try {
    await loadEventsToCppService();
    const result = await callCppService('record_pnm_attendance', {
      eventId: req.params.eventId,
      pnmId: req.body.pnmId
    });
    
    if (result.success) {
      await db.ref(`events/${req.params.eventId}`).update(result.event);
    }
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== PHILANTHROPY SPECIFIC ====================

app.post('/api/events/:eventId/donate', async (req, res) => {
  try {
    await loadEventsToCppService();
    const result = await callCppService('add_donation', {
      eventId: req.params.eventId,
      amount: req.body.amount
    });
    
    if (result.success) {
      await db.ref(`events/${req.params.eventId}`).update(result.event);
    }
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== SOCIAL SPECIFIC ====================

app.post('/api/events/:eventId/sell-ticket', async (req, res) => {
  try {
    await loadEventsToCppService();
    const result = await callCppService('sell_ticket', {
      eventId: req.params.eventId
    });
    
    if (result.success) {
      await db.ref(`events/${req.params.eventId}`).update(result.event);
    }
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =============== LOGIN / REGISTRATION ================



// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚀 Fraternity Calendar API running on port ${PORT}`);
  console.log(`📁 C++ service path: ${CPP_EXECUTABLE}`);
});
