import { create } from "zustand";

const useAuthStore = create((set) => ({
  access: localStorage.getItem("access"),
  refresh: localStorage.getItem("refresh"),
  user: null,

  login: ({ access, refresh }) => {
    localStorage.setItem("access", access);
    localStorage.setItem("refresh", refresh);
    set({ access, refresh });
  },

  logout: () => {
    localStorage.clear();
    set({ access: null, refresh: null, user: null });
  },
}));

export default useAuthStore;
