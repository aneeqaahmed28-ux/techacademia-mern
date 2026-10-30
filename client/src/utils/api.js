const API_URL = import.meta.env.VITE_API_URL || "";

const NO_REFRESH = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/refresh",
  "/api/auth/logout",
];

const UNSAFE = new Set(["POST", "PUT", "PATCH", "DELETE"]);

let csrfToken = "";

export function setCsrfToken(token) {
  if (typeof token === "string" && token) {
    csrfToken = token;
  }
}

function browserCsrfToken() {
  if (csrfToken) {
    return csrfToken;
  }
  if (typeof document === "undefined") {
    return "";
  }
  const match = document.cookie.match(/(?:^|; )csrfToken=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : "";
}

export function apiUrl(path) {
  return `${API_URL}${path}`;
}

export async function api(path, options = {}, allowRefresh = true) {
  const { json, headers, body: rawBody, ...rest } = options;
  const finalHeaders = { ...headers };
  let body = rawBody;
  const method = (rest.method || "GET").toUpperCase();

  if (json !== undefined) {
    finalHeaders["Content-Type"] = "application/json";
    body = JSON.stringify(json);
  }
  if (UNSAFE.has(method)) {
    const token = browserCsrfToken();
    if (token) {
      finalHeaders["X-CSRF-Token"] = token;
    }
  }

  const response = await fetch(apiUrl(path), {
    ...rest,
    method,
    headers: finalHeaders,
    body,
    credentials: "include",
  });

  const skipRefresh = !allowRefresh || NO_REFRESH.some((prefix) => path.startsWith(prefix));
  if (response.status === 401 && !skipRefresh) {
    const refreshHeaders = {};
    const token = browserCsrfToken();
    if (token) {
      refreshHeaders["X-CSRF-Token"] = token;
    }
    const refresh = await fetch(apiUrl("/api/auth/refresh"), {
      method: "POST",
      credentials: "include",
      headers: refreshHeaders,
    });
    if (refresh.ok) {
      const refreshed = await refresh.json().catch(() => ({}));
      setCsrfToken(refreshed.csrfToken);
      return api(path, options, false);
    }
  }

  return response;
}
