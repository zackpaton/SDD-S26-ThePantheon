require("dotenv").config();

const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { URL } = require("node:url");

const PORT = Number(process.env.PORT) || 3001;
const BODY_LIMIT = 65536;

let firebaseAdmin = null;

function sendJson(res, status, body) {
  const data = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(data);
}

function readJsonBody(req, limit = BODY_LIMIT) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > limit) {
        req.destroy();
        reject(Object.assign(new Error("Payload too large"), { code: "LIMIT" }));
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      if (!raw.trim()) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(Object.assign(new Error("Invalid JSON"), { code: "JSON" }));
      }
    });
    req.on("error", reject);
  });
}

function getFirebaseAdmin() {
  if (firebaseAdmin) return firebaseAdmin;
  const admin = require("firebase-admin");
  if (admin.apps.length > 0) {
    firebaseAdmin = admin;
    return admin;
  }
  const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!credPath) return null;
  const resolved = path.isAbsolute(credPath)
    ? credPath
    : path.join(process.cwd(), credPath);
  if (!fs.existsSync(resolved)) return null;
  const serviceAccount = JSON.parse(fs.readFileSync(resolved, "utf8"));
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  firebaseAdmin = admin;
  return admin;
}

function mapCreateUserError(err) {
  const code = err.code || err.errorInfo?.code || "";
  switch (code) {
    case "auth/email-already-exists":
      return { status: 409, message: "Email already in use", code };
    case "auth/invalid-email":
      return { status: 400, message: "Invalid email", code };
    case "auth/weak-password":
      return { status: 400, message: "Password is too weak", code };
    default:
      return { status: 500, message: "Could not create account", code: code || undefined };
  }
}

async function signInWithPassword(email, password) {
  const key = process.env.FIREBASE_WEB_API_KEY;
  if (!key) {
    const e = new Error("FIREBASE_WEB_API_KEY is not set");
    e.code = "CONFIG";
    throw e;
  }
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(key)}`;
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      password,
      returnSecureToken: true,
    }),
  });
  const data = await resp.json();
  if (!resp.ok) {
    const msg = data.error?.message || "Sign-in failed";
    const e = new Error(msg);
    e.firebaseMessage = msg;
    throw e;
  }
  return {
    idToken: data.idToken,
    refreshToken: data.refreshToken,
    expiresIn: data.expiresIn,
    uid: data.localId,
    email: data.email,
  };
}

function mapSignInError(firebaseMessage) {
  const m = String(firebaseMessage || "");
  if (
    m.includes("EMAIL_NOT_FOUND") ||
    m.includes("INVALID_PASSWORD") ||
    m.includes("INVALID_LOGIN_CREDENTIALS") ||
    m.includes("USER_DISABLED")
  ) {
    return { status: 401, message: "Invalid email or password" };
  }
  if (m.includes("INVALID_EMAIL")) {
    return { status: 400, message: "Invalid email" };
  }
  if (m.includes("TOO_MANY_ATTEMPTS_TRY_LATER")) {
    return { status: 429, message: "Too many attempts; try again later" };
  }
  return { status: 400, message: "Sign-in failed" };
}

function parseCredentials(body) {
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!email || !password) {
    return { error: { status: 400, message: "email and password are required" } };
  }
  if (password.length < 6) {
    return {
      error: { status: 400, message: "password must be at least 6 characters" },
    };
  }
  return { email, password };
}

async function handleSignUp(req, res) {
  const admin = getFirebaseAdmin();
  if (!admin) {
    sendJson(res, 503, {
      error: "Auth service not configured",
      hint: "Set GOOGLE_APPLICATION_CREDENTIALS to your Firebase service account JSON path (file must exist).",
    });
    return;
  }

  let body;
  try {
    body = await readJsonBody(req);
  } catch (err) {
    if (err.code === "LIMIT") {
      sendJson(res, 413, { error: "Payload too large" });
      return;
    }
    sendJson(res, 400, { error: "Invalid JSON body" });
    return;
  }

  const parsed = parseCredentials(body);
  if (parsed.error) {
    sendJson(res, parsed.error.status, { error: parsed.error.message });
    return;
  }

  try {
    const user = await admin.auth().createUser({
      email: parsed.email,
      password: parsed.password,
    });
    sendJson(res, 201, { uid: user.uid, email: user.email });
  } catch (err) {
    const mapped = mapCreateUserError(err);
    sendJson(res, mapped.status, {
      error: mapped.message,
      ...(mapped.code && { code: mapped.code }),
    });
  }
}

async function handleSignIn(req, res) {
  if (!process.env.FIREBASE_WEB_API_KEY) {
    sendJson(res, 503, {
      error: "Sign-in not configured",
      hint: "Set FIREBASE_WEB_API_KEY from Firebase Console → Project settings → General → Web API key.",
    });
    return;
  }

  let body;
  try {
    body = await readJsonBody(req);
  } catch (err) {
    if (err.code === "LIMIT") {
      sendJson(res, 413, { error: "Payload too large" });
      return;
    }
    sendJson(res, 400, { error: "Invalid JSON body" });
    return;
  }

  const parsed = parseCredentials(body);
  if (parsed.error) {
    sendJson(res, parsed.error.status, { error: parsed.error.message });
    return;
  }

  try {
    const session = await signInWithPassword(parsed.email, parsed.password);
    sendJson(res, 200, {
      idToken: session.idToken,
      refreshToken: session.refreshToken,
      expiresIn: session.expiresIn,
      user: { uid: session.uid, email: session.email },
    });
  } catch (err) {
    if (err.code === "CONFIG") {
      sendJson(res, 503, { error: err.message });
      return;
    }
    const mapped = mapSignInError(err.firebaseMessage || err.message);
    sendJson(res, mapped.status, { error: mapped.message });
  }
}

async function handleRequest(req, res, url) {
  if (req.method === "GET" && url.pathname === "/api/health") {
    sendJson(res, 200, { ok: true, service: "the-pantheon-backend" });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/auth/sign-up") {
    await handleSignUp(req, res);
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/auth/sign-in") {
    await handleSignIn(req, res);
    return;
  }

  sendJson(res, 404, { error: "Not found" });
}

const server = http.createServer((req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    res.end();
    return;
  }

  const host = req.headers.host || `localhost:${PORT}`;
  const url = new URL(req.url || "/", `http://${host}`);

  handleRequest(req, res, url).catch((err) => {
    console.error(err);
    if (!res.headersSent) {
      sendJson(res, 500, { error: "Internal server error" });
    }
  });
});

server.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});
