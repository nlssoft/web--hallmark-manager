import api from "./axios";
import { createApiError } from "./error";

export const loadEmployees = async (params = {}) => {
  try {
    const res = await api.get("/auth/employee/", { params });
    return res.data;
  } catch (err) {
    throw createApiError(err);
  }
};

export const createEmployees = async (data) => {
  try {
    const res = await api.post("/auth/employee/", data);
    return res.data;
  } catch (err) {
    throw createApiError(err);
  }
};

export const getEmployee = async (id) => {
  try {
    const res = await api.get(`/auth/employee/${id}/`);
    return res.data;
  } catch (err) {
    throw createApiError(err);
  }
};

export const updateEmployee = async (id, data) => {
  try {
    const res = await api.patch(`/auth/employee/${id}/`, data);
    return res.data;
  } catch (err) {
    throw createApiError(err);
  }
};

export const deleteEmployee = async (id) => {
  try {
    await api.delete(`/auth/employee/${id}/`);
  } catch (err) {
    throw createApiError(err);
  }
};

// ban and unban
export const banEmployee = async (id) => {
  try {
    const res = await api.post(`/auth/employee/${id}/ban/`);
    return res.data;
  } catch (err) {
    throw createApiError(err);
  }
};

export const unbanEmployee = async (id) => {
  try {
    const res = await api.post(`/auth/employee/${id}/unban/`);
    return res.data;
  } catch (err) {
    throw createApiError(err);
  }
};
