const { getAllowedOrigins } = require("../config/env");

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

// Cookie-authenticated unsafe requests must come from a configured origin (CSRF).
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
  return next();
}

module.exports = originMiddleware;
