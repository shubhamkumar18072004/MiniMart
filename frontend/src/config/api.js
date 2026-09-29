import axios from "axios";

function trimTrailingSlashes(s) {
  return String(s).replace(/\/+$/, "");
}

function resolveApiBaseUrl() {
  const fromEnv = process.env.REACT_APP_API_URL;
  if (fromEnv != null && String(fromEnv).trim() !== "") {
    return trimTrailingSlashes(String(fromEnv));
  }
  if (process.env.NODE_ENV === "production") {
    return "";
  }
  return "http://localhost:5000";
}

/** API origin without trailing slash, or "" for same-origin relative URLs (typical production). */
export const API_BASE_URL = resolveApiBaseUrl();

/** Use for all backend HTTP calls; dev uses REACT_APP_API_URL / localhost:5000, prod uses same-origin unless overridden. */
export const apiClient = axios.create({
  baseURL: API_BASE_URL === "" ? undefined : API_BASE_URL,
});

/**
 * @param {string} path - Path starting with / (e.g. "/api/products")
 */
export function apiUrl(path) {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (API_BASE_URL === "") {
    return normalized;
  }
  return `${API_BASE_URL}${normalized}`;
}
