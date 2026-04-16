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

/** Sends one command to the C++ process and returns the parsed JSON result as a Promise. */
function callCppService(command, data = null) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ command, data });

    pendingResolvers.push(resolve);

    cpp.stdin.write(`${payload}\n`, (err) => {
      if (err) {
        pendingResolvers.pop();
        reject(err);
      }
    });
  });
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

module.exports = {
  CPP_EXECUTABLE,
  cpp,
  callCppService,
  convertEventDates,
  getEasternISO,
  loadUsersToCppService,
  loadEventsToCppService,
};
