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

api.interceptors.request.use((config) => {
  const csrfToken = getCsrfToken();

  if (csrfToken) {
    config.headers = config.headers ?? {};
    config.headers["X-CSRFToken"] = csrfToken;
  }

  return config;
});

let isRefreshing = false;
let failedQueue = [];

function processQueue(error) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve();
  });

  failedQueue = [];
}

function shouldSkipRefresh(url = "") {
  return [
    "/auth/login/",
    "/auth/refresh/",
    "/auth/logout/",
    "/auth/csrf/",
  ].some((path) => url.includes(path));
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (
      !original ||
      error.response?.status !== 401 ||
      original._retry ||
      shouldSkipRefresh(original.url)
    ) {
      return Promise.reject(error);
    }

    original._retry = true;

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
      return api(original);
    } catch (err) {
      processQueue(err);

      if (window.location.pathname !== "/login") {
        window.location.replace("/login");
      }

      return Promise.reject(err);
    } finally {
      isRefreshing = false;
    }
  },
);

export default api;
