const API_URL = import.meta.env.VITE_SCHEME_API_URL?.replace(/\/$/, "");

export const hasSchemeApi = Boolean(API_URL);

async function post(path, body) {
  if (!API_URL) return null;
  const response = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`Scheme API request failed (${response.status})`);
  return response.json();
}

async function get(path, params = {}) {
  if (!API_URL) return null;
  const query = new URLSearchParams(Object.entries(params).filter(([, value]) => value !== "" && value != null));
  const response = await fetch(`${API_URL}${path}${query.size ? `?${query}` : ""}`);
  if (!response.ok) throw new Error(`Scheme API request failed (${response.status})`);
  return response.json();
}

export async function getCatalogRecommendations(question, profile, limit = 6) {
  const data = await post("/recommend", { question, profile, limit, language: "en" });
  return data?.recommendations || [];
}

export async function askCatalog(question, language, profile) {
  return post("/ask", { question, language, profile, limit: 4 });
}

export async function discoverWebSchemes(state, question = "", limit = 5) {
  return post("/discover", { state, question, limit });
}

export async function getCatalogFilters() {
  return get("/filters");
}

export async function getCatalogSchemes(filters = {}) {
  return get("/schemes", filters);
}
