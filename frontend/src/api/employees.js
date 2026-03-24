import api from "./axios";

export const getEmployees = () => api.get("/auth/employee/");
