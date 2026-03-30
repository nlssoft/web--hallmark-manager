import api from "./axios";
import { createApiError } from "./error";

export const loadParties = async (params = {}) => {
  try {
    const res = await api.get(`/history/party/`, { params });
    return res.data;
  } catch (err) {
    throw createApiError(err);
  }
};

export const createParties = async (data) => {
  try {
    res = await api.post(`/history/party/`, data);
    return res.data;
  } catch (err) {
    throw createApiError(err);
  }
};

export const getParty = async (id) => {
  try {
    res = await api.get(`/history/party/${id}/`);
    return res.data;
  } catch (err) {
    throw createApiError(err);
  }
};

export const updateParty = async (id, data) => {
  try {
    res = await api.put(`/history/party/${id}/`, data);
    return res.data;
  } catch (err) {
    throw createApiError(err);
  }
};

export const deleteParty = async (id) => {
  try {
    res = await api.delete(`/history/party/${id}/`);
    return res.data;
  } catch (err) {
    throw createApiError(err);
  }
};
