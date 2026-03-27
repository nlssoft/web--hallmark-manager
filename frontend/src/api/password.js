import api from "./axios";

//for sending email to get uid and token
export const sendEmail = (email) =>
  api.post("/auth/users/reset_password/", { email });

//for confirming password
export const resetPassword = (data) =>
  api.post("/auth/users/reset_password_confirm/", data);
