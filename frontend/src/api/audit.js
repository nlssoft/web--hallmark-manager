import api from "./axios";
import { createApiError } from "./error";

export const loadAudit = async (params = {}) => {
  try {
    const res = await api.get(`/history/audit-log/`, { params });
    return res.data;
  } catch (err) {
    throw createApiError(err);
  }
};

export const getAudit = async (id) => {
  try {
    const res = await api.get(`/history/audit-log/${id}/`);
    return res.data;
  } catch (err) {
    throw createApiError(err);
  }
};
