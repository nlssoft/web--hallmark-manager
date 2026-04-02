import api from "./axios";
import { createApiError } from "./error";

export const loadRecords = async (params = {}) => {
  try {
    const res = await api.get(`/history/record/`, { params });
    return res.data;
  } catch (err) {
    throw createApiError(err);
  }
};

export const createRecord = async (data) => {
  try {
    const res = await api.post(`/history/record/`, data);
    return res.data;
  } catch (err) {
    throw createApiError(err);
  }
};

export const getRecord = async (id) => {
  try {
    const res = await api.get(`/history/record/${id}/`);
    return res.data;
  } catch (err) {
    throw createApiError(err);
  }
};

export const updateRecord = async (id, data) => {
  try {
    const res = await api.put(`/history/record/${id}/`, data);
    return res.data;
  } catch (err) {
    throw createApiError(err);
  }
};

export const deleteRecord = async (id) => {
  try {
    const res = await api.delete(`/history/record/${id}/`);
    return res.data;
  } catch (err) {
    throw createApiError(err);
  }
};
