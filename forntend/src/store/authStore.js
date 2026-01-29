import { create } from "zustand";

const useAuthStore = create((set) => ({
  access: localStorage.getItem("access"),
  refresh: localStorage.getItem("refresh"),
  isAuthenticated: !!localStorage.getItem("access"),

  login: (access, refresh) => {
    localStorage.setItem("access", access);
    localStorage.setItem("refresh", refresh);
    set({ access, refresh, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    set({ access: null, refresh: null, isAuthenticated: false });
  },
}));

export default useAuthStore;
