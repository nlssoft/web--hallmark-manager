import api from "./axios";

export const getParties = (params) => api.get(`/history/party/`, { params });
export const createParties = (data) => api.post(`/history/party/`, data);
export const getParty = (id) => api.get(`/history/party/${id}/`);
export const updateParty = (id, data) => api.put(`/history/party/${id}/`, data);
export const deleteParty = (id) => api.delete(`/history/party/${id}/`);
export const patchParty = (id, data) =>
  api.patch(`/history/party/${id}/`, data);
