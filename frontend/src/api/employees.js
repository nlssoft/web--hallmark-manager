import api from "./axios";

const createApiError = (err) => {
  const status = err.response?.status;
  const data = err.response?.data;

  const apiError = new Error("Something went wrong");

  if (status === 403) {
    apiError.message =
      typeof data?.detail === "string"
        ? data.detail
        : typeof data?.error === "string"
          ? data.error
          : "You are not allowed to access this page";
    return apiError;
  }

  if (status === 401) {
    apiError.message = "Session expired. Please login again.";
    return apiError;
  }

  if (status >= 500) {
    apiError.message = "Server error. Try again later.";
    return apiError;
  }

  if (typeof data === "string") {
    apiError.message = data;
    return apiError;
  }

  if (Array.isArray(data)) {
    apiError.message = data.map(String).join(" ");
    return apiError;
  }

  if (data && typeof data === "object") {
    const fieldErrors = Object.fromEntries(
      Object.entries(data)
        .map(([field, value]) => {
          const messages = (Array.isArray(value) ? value : [value])
            .filter(Boolean)
            .map(String);

          return [field, messages.join(" ")];
        })
        .filter(([, message]) => message),
    );

    if (Object.keys(fieldErrors).length > 0) {
      apiError.fieldErrors = fieldErrors;
      apiError.message =
        fieldErrors.non_field_errors ||
        fieldErrors.detail ||
        fieldErrors.error ||
        Object.values(fieldErrors).join(" ");
      return apiError;
    }
  }

  apiError.message = err.message || "Something went wrong";
  return apiError;
};

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
