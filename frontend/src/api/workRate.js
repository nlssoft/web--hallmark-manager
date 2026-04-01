import api from "./axios";
import { createApiError } from "./error";

export const loadWorkRate = async (params = {}) => {
  try {
    const res = await api.get(`/history/work-rate/`, { params });
    return res.data;
  } catch (err) {
    throw createApiError(err);
  }
};

export const createWorkRate = async (data) => {
  try {
    const res = await api.post(`/history/work-rate/`, data);
    return res.data;
  } catch (err) {
    throw createApiError(err);
  }
};

export const getWorkRate = async (id) => {
  try {
    const res = await api.get(`/history/work-rate/${id}/`);
    return res.data;
  } catch (err) {
    throw createApiError(err);
  }
};

export const updateWorkRate = async (id, data) => {
  try {
    const res = await api.put(`/history/work-rate/${id}/`, data);
    return res.data;
  } catch (err) {
    throw createApiError(err);
  }
};

export const deleteWorkRate = async (id) => {
  try {
    const res = await api.delete(`/history/work-rate/${id}/`);
    return res.data;
  } catch (err) {
    throw createApiError(err);
  }
};
