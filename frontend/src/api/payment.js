import api from "./axios";
import { createApiError } from "./error";

export const loadPayments = async (params = {}) => {
  try {
    const res = await api.get(`/history/payment/`, { params });
    return res.data;
  } catch (err) {
    throw createApiError(err);
  }
};

export const createPayment = async (data) => {
  try {
    const res = await api.post(`/history/payment/`, data);
    return res.data;
  } catch (err) {
    throw createApiError(err);
  }
};

export const getPayment = async (id) => {
  try {
    const res = await api.get(`/history/payment/${id}/`);
    return res.data;
  } catch (err) {
    throw createApiError(err);
  }
};

export const patchPayment = async (id, data) => {
  try {
    const res = await api.patch(`/history/payment/${id}/`, data);
    return res.data;
  } catch (err) {
    throw createApiError(err);
  }
};

export const deletePayment = async (id) => {
  try {
    const res = await api.delete(`/history/payment/${id}/`);
    return res.data;
  } catch (err) {
    throw createApiError(err);
  }
};
