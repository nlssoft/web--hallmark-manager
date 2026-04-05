import api from "./axios";
import { createApiError } from "./error";

export const getSummary = async (params = {}) => {
  try {
    const res = await api.get(`/history/summary/`, { params });

    return {
      ...res.data,
      type: res.data.type?.toLowerCase(),
    };
  } catch (err) {
    throw createApiError(err);
  }
};
