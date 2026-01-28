import axios from "axios";
import useAuthStore from "../store/authStore";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");
  if (token) {
    config.headers.Authorization = `JWT ${token}`;
  }
  return config;
});

export default api;
