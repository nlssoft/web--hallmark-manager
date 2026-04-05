import api from "./axios";
import { createApiError } from "./error";

export const loadRequests = async (params = {}) => {
  try {
    const res = await api.get("/history/request-payment/", { params });
    return res.data;
  } catch (err) {
    throw createApiError(err);
  }
};

export const getRequest = async (id) => {
  try {
    const res = await api.get(`/history/request-payment/${id}/`);
    return res.data;
  } catch (err) {
    throw createApiError(err);
  }
};

export const createRequest = async (data) => {
  try {
    const res = await api.post("/history/request-payment/", data);
    return res.data;
  } catch (err) {
    throw createApiError(err);
  }
};

export const updateRequest = async (id, data) => {
  try {
    const res = await api.patch(`/history/request-payment/${id}/`, data);
    return res.data;
  } catch (err) {
    throw createApiError(err);
  }
};

export const deleteRequest = async (id) => {
  try {
    await api.delete(`/history/request-payment/${id}/`);
  } catch (err) {
    throw createApiError(err);
  }
};

export const approveRequest = async (id) => {
  try {
    const res = await api.post(`/history/request-payment/${id}/approve/`);
    return res.data;
  } catch (err) {
    throw createApiError(err);
  }
};

export const rejectRequest = async (id, data) => {
  try {
    const res = await api.post(`/history/request-payment/${id}/reject/`, data);
    return res.data;
  } catch (err) {
    throw createApiError(err);
  }
};

// Records eligible to add to a new request (sub-user only).
// ADJUST the URL below if your records router prefix is different.
export const loadEligibleRecords = async () => {
  try {
    const res = await api.get("/history/request-payment/eligible_records/", {
      params: { page_size: 1000 },
    });
    return res.data;
  } catch (err) {
    throw createApiError(err);
  }
};
