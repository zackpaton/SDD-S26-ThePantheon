/**
 * C++ calendar service bridge: spawns the native executable, sends JSON commands on stdin,
 * and matches line-delimited JSON responses to pending Promise resolvers.
 */
const { spawn } = require('child_process');
const path = require('path');
const { db } = require('./firebase');

const CPP_EXECUTABLE = path.join(__dirname, '../../cpp-service/build/calendar_service');

const cpp = spawn(CPP_EXECUTABLE);

cpp.stderr.on('data', (data) => {
  console.error('C++ Error:', data.toString());
});

cpp.on('error', (err) => {
  console.error('C++ process error:', err);
});

cpp.on('close', (code, signal) => {
  console.error(`C++ process exited (code=${code}, signal=${signal})`);
});

/**
 * One in-flight C++ command at a time. Parallel calls were interleaving stdin writes and breaking
 * the line-delimited request/response pairing with pendingResolvers (and could crash the child).
 */
let cppCallChain = Promise.resolve();

let pendingResolvers = [];

/** Incomplete line from the last stdout chunk (long JSON is often split across multiple 'data' events). */
let stdoutLineBuffer = '';

cpp.stdout.on('data', (data) => {
  stdoutLineBuffer += data.toString('utf8');

  let newlineIndex;
  while ((newlineIndex = stdoutLineBuffer.indexOf('\n')) >= 0) {
    const line = stdoutLineBuffer.slice(0, newlineIndex);
    stdoutLineBuffer = stdoutLineBuffer.slice(newlineIndex + 1);

    const trimmed = line.trim();
    if (!trimmed) continue;

    try {
      const result = JSON.parse(trimmed);
      const resolve = pendingResolvers.shift();
      if (resolve) resolve(result);
    } catch (err) {
      console.error('Invalid JSON from C++:', trimmed.slice(0, 400), err.message);
    }
  }
});

/** Sends one command to the C++ process and returns the parsed JSON result as a Promise. */
function callCppService(command, data = null) {
  const payload = JSON.stringify({ command, data });

  const operation = cppCallChain.then(() => {
    return new Promise((resolve, reject) => {
      if (cpp.stdin.destroyed || !cpp.stdin.writable) {
        reject(new Error('C++ service stdin is closed'));
        return;
      }
      pendingResolvers.push(resolve);
      cpp.stdin.write(`${payload}\n`, (err) => {
        if (err) {
          pendingResolvers.pop();
          reject(err);
        }
      });
    });
  });

  cppCallChain = operation.catch(() => {
    /* keep the chain unblocked so later API calls can run */
  });

  return operation;
}

/** Formats a Date as an ISO-like string in America/New_York (used for consistent event timestamps). */
function getEasternISO(date) {
  return `${date.toLocaleString('sv-SE', {
    timeZone: 'America/New_York',
    hour12: false,
  }).replace(' ', 'T')}-04:00`;
}

/** Converts ISO date/time strings on an event object to Unix seconds for the C++ service. */
function convertEventDates(event) {
  return {
    ...event,
    date: event.date ? Math.floor(new Date(event.date).getTime() / 1000) : null,
    startTime: event.startTime ? Math.floor(new Date(event.startTime).getTime() / 1000) : null,
    endTime: event.endTime ? Math.floor(new Date(event.endTime).getTime() / 1000) : null,
  };
}

/** Reads all users from Firebase and issues load_users so the C++ user registry matches the database. */
async function loadUsersToCppService() {
  try {
    const snapshot = await db.ref('users').once('value');
    const usersData = snapshot.val();

    if (!usersData) {
      return { success: true, count: 0 };
    }

    const usersArray = Object.entries(usersData).map(([uid, data]) => ({
      id: uid,
      ...(data && typeof data === 'object' ? data : {}),
    }));

    const result = await callCppService('load_users', { users: usersArray });
    return result;
  } catch (error) {
    console.error('Error loading users to C++ service:', error);
    throw error;
  }
}

/** Reads all events from Firebase and issues a load_events command so the C++ engine stays in sync. */
async function loadEventsToCppService() {
  try {
    const snapshot = await db.ref('events').once('value');
    const eventsData = snapshot.val();

    if (!eventsData) {
      return { success: true, count: 0 };
    }

    const eventsArray = Object.values(eventsData).map((event) => convertEventDates(event));

    console.log(eventsArray);

    const result = await callCppService('load_events', { events: eventsArray });
    console.log(result);
    return result;
  } catch (error) {
    console.error('Error loading events to C++ service:', error);
    throw error;
  }
}

/** Reads eventFeedback/* from Firebase and issues load_event_feedback for the C++ registry. */
async function loadEventFeedbackToCppService() {
  try {
    const snapshot = await db.ref('eventFeedback').once('value');
    const val = snapshot.val();
    const feedback = val && typeof val === 'object' ? val : {};
    return await callCppService('load_event_feedback', { feedback });
  } catch (error) {
    console.error('Error loading event feedback to C++ service:', error);
    throw error;
  }
}

module.exports = {
  CPP_EXECUTABLE,
  cpp,
  callCppService,
  convertEventDates,
  getEasternISO,
  loadUsersToCppService,
  loadEventsToCppService,
  loadEventFeedbackToCppService,
};
