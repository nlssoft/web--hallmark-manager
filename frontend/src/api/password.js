import api from "./axios";

export const resetPassword = (data) =>
  api.post("/auth/users/reset_password_confirm/", data);
