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

function csrfCookieOptions() {
  return {
    httpOnly: false,
    secure: process.env.COOKIE_SECURE === "true",
    sameSite: resolveSameSite(),
    path: "/",
    maxAge: refreshTtlMs(),
  };
}

function setAuthCookies(res, { accessToken, refreshToken, csrfToken }) {
  res.cookie("accessToken", accessToken, accessCookieOptions());
  res.cookie("refreshToken", refreshToken, refreshCookieOptions());
  res.cookie("csrfToken", csrfToken, csrfCookieOptions());
}

function clearAuthCookies(res) {
  res.clearCookie("accessToken", baseCookieOptions("/"));
  res.clearCookie("refreshToken", baseCookieOptions("/api/auth"));
  res.clearCookie("csrfToken", {
    httpOnly: false,
    secure: process.env.COOKIE_SECURE === "true",
    sameSite: resolveSameSite(),
    path: "/",
  });
}

module.exports = {
  accessCookieOptions,
  refreshCookieOptions,
  csrfCookieOptions,
  setAuthCookies,
  clearAuthCookies,
};
