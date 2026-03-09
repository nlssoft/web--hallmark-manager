import axios from "axios";

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop().split(";")[0];
  }
  return null;
}

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000",
  withCredentials: true,
});

API.interceptors.request.use((config) => {
  const method = config.method?.toUpperCase();
  if (method && MUTATING_METHODS.has(method)) {
    const csrfToken = getCookie("csrftoken");
    if (csrfToken) {
      config.headers["X-CSRFToken"] = csrfToken;
    }
  }
  return config;
});

export default API;
