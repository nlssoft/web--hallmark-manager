import api from "./axios";

export const loginRequest = (username, password) =>
  api.post("/auth/jwt/create/", { username, password });

export const me = () =>
  api.get("/auth/users/me/");
