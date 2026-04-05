import api from "./axios";
import { createApiError } from "./error";

export const loadAdvance = async (params = {}) => {
  try {
    const res = await api.get(`/history/advance-ledger/`, { params });
    return res.data;
  } catch (err) {
    throw createApiError(err);
  }
};

export const getAdvance = async (id) => {
  try {
    const res = await api.get(`/history/advance-ledger/${id}/`);
    return res.data;
  } catch (err) {
    throw createApiError(err);
  }
};
