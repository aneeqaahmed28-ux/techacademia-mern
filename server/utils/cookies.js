const { accessMaxAgeMs, refreshTtlMs } = require("./tokens");

function resolveSameSite() {
  const value = String(process.env.COOKIE_SAMESITE || "lax").toLowerCase();
  const secure = process.env.COOKIE_SECURE === "true";
  if (!["lax", "strict", "none"].includes(value)) {
    return "lax";
  }
  if (value === "none" && !secure) {
    return "lax";
  }
  return value;
}

function baseCookieOptions(path) {
  return {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === "true",
    sameSite: resolveSameSite(),
    path,
  };
}

function accessCookieOptions() {
  return { ...baseCookieOptions("/"), maxAge: accessMaxAgeMs() };
}

function refreshCookieOptions() {
  return { ...baseCookieOptions("/api/auth"), maxAge: refreshTtlMs() };
}

function setAuthCookies(res, { accessToken, refreshToken }) {
  res.cookie("accessToken", accessToken, accessCookieOptions());
  res.cookie("refreshToken", refreshToken, refreshCookieOptions());
}

function clearAuthCookies(res) {
  res.clearCookie("accessToken", baseCookieOptions("/"));
  res.clearCookie("refreshToken", baseCookieOptions("/api/auth"));
}

module.exports = {
  accessCookieOptions,
  refreshCookieOptions,
  setAuthCookies,
  clearAuthCookies,
};
