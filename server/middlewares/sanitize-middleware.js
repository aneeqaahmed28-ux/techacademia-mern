const BLOCKED_KEYS = new Set(["__proto__", "constructor", "prototype"]);

function containsOperator(value) {
  if (!value || typeof value !== "object") {
    return false;
  }
  for (const key of Object.keys(value)) {
    if (key.startsWith("$") || key.includes(".") || BLOCKED_KEYS.has(key)) {
      return true;
    }
    if (containsOperator(value[key])) {
      return true;
    }
  }
  return false;
}

function sanitizeMiddleware(req, res, next) {
  if (
    containsOperator(req.body) ||
    containsOperator(req.query) ||
    containsOperator(req.params)
  ) {
    return res.status(400).json({ message: "Invalid input" });
  }
  return next();
}

module.exports = sanitizeMiddleware;
