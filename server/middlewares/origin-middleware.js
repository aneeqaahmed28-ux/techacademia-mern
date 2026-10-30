const { getAllowedOrigins } = require("../config/env");

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

// Cookie sessions need both an allowed Origin and a matching CSRF token.
// The token is a non-HttpOnly cookie plus the X-CSRF-Token header.
function originMiddleware(req, res, next) {
  if (SAFE_METHODS.has(req.method.toUpperCase())) {
    return next();
  }
  if (!req.headers.cookie) {
    return next();
  }

  const origin = req.headers.origin;
  if (!origin || !getAllowedOrigins().includes(origin)) {
    return res.status(403).json({ message: "Request origin is not allowed" });
  }

  const csrfCookie = req.cookies.csrfToken;
  const csrfHeader = req.get("x-csrf-token");
  if (typeof csrfCookie !== "string" || typeof csrfHeader !== "string" || csrfCookie !== csrfHeader) {
    return res.status(403).json({ message: "Invalid CSRF token" });
  }
  return next();
}

module.exports = originMiddleware;
