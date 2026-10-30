const rateLimit = require("express-rate-limit");

function createAuthLimiter(options = {}) {
  const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000;
  const max = options.max || Number(process.env.RATE_LIMIT_AUTH_MAX) || 10;

  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many attempts. Try again later." },
  });
}

module.exports = { createAuthLimiter };
