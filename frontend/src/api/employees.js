import api from "./axios";

export const loadEmployees = (params) => api.get("/auth/employee/");
export const createEmployees = (data) => api.post("/auth/employee/", data);
export const getEmployee = (id) => api.get(`/auth/employee/${id}/`);
export const updateEmployee = (id, data) =>
  api.patch(`/auth/employee/${id}/`, data);
export const deleteEmployee = (id) => api.delete(`/auth/employee/${id}/`);
