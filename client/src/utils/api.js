const API_URL = import.meta.env.VITE_API_URL || "";

const NO_REFRESH = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/refresh",
  "/api/auth/logout",
];

export function apiUrl(path) {
  return `${API_URL}${path}`;
}

export async function api(path, options = {}, allowRefresh = true) {
  const { json, headers, body: rawBody, ...rest } = options;
  const finalHeaders = { ...headers };
  let body = rawBody;

  if (json !== undefined) {
    finalHeaders["Content-Type"] = "application/json";
    body = JSON.stringify(json);
  }

  const response = await fetch(apiUrl(path), {
    ...rest,
    headers: finalHeaders,
    body,
    credentials: "include",
  });

  const skipRefresh = !allowRefresh || NO_REFRESH.some((prefix) => path.startsWith(prefix));
  if (response.status === 401 && !skipRefresh) {
    const refresh = await fetch(apiUrl("/api/auth/refresh"), {
      method: "POST",
      credentials: "include",
    });
    if (refresh.ok) {
      return api(path, options, false);
    }
  }

  return response;
}
