const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  "https://teamforge-backend-3ccv.onrender.com/api";

export async function apiFetch(endpoint, options = {}) {
  const token = sessionStorage.getItem("teamforge_token");

  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (options.body && !(options.body instanceof FormData)) {
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    console.error(
      `TeamForge authentication error: ${endpoint} returned HTTP 401.`
    );
  }

  return response;
}
