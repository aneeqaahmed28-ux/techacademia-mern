function getAllowedOrigins() {
  const raw = process.env.CLIENT_ORIGIN || "http://localhost:5173";
  return raw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function port() {
  const parsed = Number(process.env.PORT || 5000);
  if (!Number.isInteger(parsed) || parsed <= 0 || parsed > 65535) {
    return 5000;
  }
  return parsed;
}

function assertEnv() {
  const secret = process.env.JWT_SECRET_KEY;
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET_KEY must be set and at least 32 characters");
  }
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI must be set");
  }
}

module.exports = { getAllowedOrigins, port, assertEnv };
