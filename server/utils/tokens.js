const crypto = require("crypto");
const jwt = require("jsonwebtoken");

function signAccessToken(user) {
  const secret = process.env.JWT_SECRET_KEY;
  if (!secret) {
    throw new Error("JWT_SECRET_KEY is not set");
  }
  return jwt.sign(
    {
      userId: user._id.toString(),
      tokenVersion: user.tokenVersion || 0,
    },
    secret,
    {
      expiresIn: process.env.JWT_ACCESS_EXPIRES || "15m",
      algorithm: "HS256",
    }
  );
}

function verifyAccessToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET_KEY, {
    algorithms: ["HS256"],
  });
}

function newRefreshToken() {
  return crypto.randomBytes(32).toString("base64url");
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function refreshTtlMs() {
  const days = Number(process.env.JWT_REFRESH_EXPIRES_DAYS || 7);
  if (!Number.isFinite(days) || days <= 0 || days > 30) {
    return 7 * 24 * 60 * 60 * 1000;
  }
  return days * 24 * 60 * 60 * 1000;
}

function accessMaxAgeMs() {
  const raw = process.env.JWT_ACCESS_EXPIRES || "15m";
  const match = /^(\d+)([smhd])$/.exec(raw);
  if (!match) {
    return 15 * 60 * 1000;
  }
  const amount = Number(match[1]);
  const unit = { s: 1000, m: 60 * 1000, h: 60 * 60 * 1000, d: 24 * 60 * 60 * 1000 }[
    match[2]
  ];
  return amount * unit;
}

module.exports = {
  signAccessToken,
  verifyAccessToken,
  newRefreshToken,
  hashToken,
  refreshTtlMs,
  accessMaxAgeMs,
};
