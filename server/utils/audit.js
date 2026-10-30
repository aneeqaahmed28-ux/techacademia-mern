const AuditLog = require("../models/audit-log-model");

const SENSITIVE_KEY = /password|token|secret|authorization|cookie/i;

function scrub(value) {
  if (Array.isArray(value)) {
    return value.map(scrub);
  }
  if (!value || typeof value !== "object") {
    return value;
  }
  const clean = {};
  for (const [key, entry] of Object.entries(value)) {
    if (SENSITIVE_KEY.test(key)) {
      continue;
    }
    clean[key] = scrub(entry);
  }
  return clean;
}

async function recordAudit(req, event) {
  await AuditLog.create({
    actorId: req.user._id,
    actorEmail: req.user.email,
    action: event.action,
    targetType: event.targetType,
    targetId: String(event.targetId),
    ip: req.ip,
    metadata: scrub(event.metadata || {}),
  });
}

module.exports = { scrub, recordAudit };
