// api/employees.js

import api from "./axios";

const getApiErrorMessage = (data) => {
  if (!data) return "";

  if (typeof data === "string") return data;

  if (Array.isArray(data)) {
    return data.map((item) => String(item)).join(" ");
  }

  if (typeof data === "object") {
    if (typeof data.detail === "string") return data.detail;
    if (typeof data.error === "string") return data.error;

    const messages = Object.entries(data).flatMap(([field, value]) => {
      const values = Array.isArray(value) ? value : [value];

      return values
        .filter(Boolean)
        .map((message) =>
          field === "non_field_errors"
            ? String(message)
            : `${field}: ${String(message)}`,
        );
    });

    return messages.join(" ");
  }

  return "";
};

const handleApiError = (err) => {
  const status = err.response?.status;
  const message = getApiErrorMessage(err.response?.data);

  if (status === 403)
    return message || "You are not allowed to access this page";
  if (status === 401) return "Session expired. Please login again.";
  if (status >= 500) return "Server error. Try again later.";

  return message || "Something went wrong";
};

export const loadEmployees = async (params = {}) => {
  try {
    const res = await api.get("/auth/employee/", { params });
    return res.data;
  } catch (err) {
    throw new Error(handleApiError(err));
  }
};

export const createEmployees = async (data) => {
  try {
    const res = await api.post("/auth/employee/", data);
    return res.data;
  } catch (err) {
    throw new Error(handleApiError(err));
  }
};

export const getEmployee = async (id) => {
  try {
    const res = await api.get(`/auth/employee/${id}/`);
    return res.data;
  } catch (err) {
    throw new Error(handleApiError(err));
  }
};

export const updateEmployee = async (id, data) => {
  try {
    const res = await api.patch(`/auth/employee/${id}/`, data);
    return res.data;
  } catch (err) {
    throw new Error(handleApiError(err));
  }
};

export const deleteEmployee = async (id) => {
  try {
    await api.delete(`/auth/employee/${id}/`);
  } catch (err) {
    throw new Error(handleApiError(err));
  }
};
