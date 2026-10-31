const API_URL = (import.meta.env.VITE_APP_API_URL || "http://localhost:3001/api").replace(/\/$/, "");

if (typeof window !== "undefined") window.localStorage.removeItem("eligibalme.jwt");

class ApiError extends Error {
  /** @param {string} message @param {number} status */
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

/** @param {string} path @param {{method?: string, body?: unknown}} [options] */
export async function appApi(path, { method = "GET", body } = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    method,
    credentials: "include",
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (response.status === 204) return null;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(data.error || `Request failed (${response.status})`, response.status);
  }
  return data;
}

export const appAuthApi = {
  register: (name, email, password) => appApi("/auth/register", { method: "POST", body: { name, email, password } }),
  login: (email, password) => appApi("/auth/login", { method: "POST", body: { email, password } }),
  me: () => appApi("/auth/me"),
  logout: () => appApi("/auth/logout", { method: "POST" }),
  forgotPassword: (email) => appApi("/auth/forgot-password", { method: "POST", body: { email } }),
  resetPassword: (token, password) => appApi("/auth/reset-password", { method: "POST", body: { token, password } }),
};
