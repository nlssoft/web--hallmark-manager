import api from "./axios";
import { createApiError } from "./error";

export const getMyProfile = async () => {
  try {
    const res = await api.get("/auth/profile/me/");
    return res.data;
  } catch (err) {
    throw createApiError(err);
  }
};

export const updateMyProfile = async (data) => {
  try {
    const res = await api.patch("/auth/profile/update_profile/", data);
    return res.data;
  } catch (err) {
    throw createApiError(err);
  }
};
