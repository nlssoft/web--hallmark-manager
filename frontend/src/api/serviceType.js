import api from "./axios";
import { createApiError } from "./error";

export const loadService = async (params = {}) => {
  try {
    const res = await api.get(`/history/service-type/`, { params });
    return res.data;
  } catch (err) {
    throw createApiError(err);
  }
};
