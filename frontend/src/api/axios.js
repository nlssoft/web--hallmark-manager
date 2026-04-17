import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

function getCsrfToken() {
  return document.cookie
    .split("; ")
    .find((row) => row.startsWith("csrftoken="))
    ?.split("=")[1];
}

// ✅ Attach CSRF token
api.interceptors.request.use((config) => {
  const csrfToken = getCsrfToken();

  if (csrfToken) {
    config.headers = config.headers ?? {};
    config.headers["X-CSRFToken"] = csrfToken;
  }

  return config;
});

// =============================
// 🔥 RESPONSE INTERCEPTOR
// =============================

let isRefreshing = false;
let failedQueue = [];

function processQueue(error) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve();
  });
  failedQueue = [];
}

// ✅ Centralized skip logic
function shouldSkipRefresh(url = "") {
  return [
    "/auth/login/",
    "/auth/refresh/",
    "/auth/logout/",
    "/auth/csrf/",
    "/auth/profile/me/", // important
    "/auth/users/reset_password/",
    "/auth/users/reset_password_confirm/",
  ].some((path) => url.includes(path));
}

api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const original = error.config;

    // ✅ If no response or not 401 → ignore
    if (!error.response || error.response.status !== 401) {
      return Promise.reject(error);
    }

    // ✅ If request should NOT trigger refresh
    if (!original || original._retry || shouldSkipRefresh(original.url)) {
      return Promise.reject(error);
    }

    original._retry = true;

    // 🧠 If refresh already running → queue request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then(() => api(original))
        .catch((err) => Promise.reject(err));
    }

    isRefreshing = true;

    try {
      await api.post("/auth/refresh/");

      processQueue(null);

      return api(original); // retry original request
    } catch (err) {
      processQueue(err);

      // ✅ Only redirect if NOT already on login
      if (window.location.pathname !== "/login") {
        window.location.replace("/login");
      }

      return Promise.reject(err);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
