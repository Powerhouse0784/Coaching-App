import { create } from "zustand";
import api from "@/lib/api";
import { saveToken, saveUser, getUser, getToken, clearAuth } from "@/lib/auth";
import { registerUnauthorizedHandler } from "@/lib/authEvents";
import type { SessionUser } from "@/types";
import { useUIStore } from "@/store/uiStore";

interface AuthState {
  user: SessionUser | null;
  isLoading: boolean;
  isHydrated: boolean;
  error: string | null;
  login: (email: string, password: string, role: "STUDENT" | "TEACHER") => Promise<void>;
  register: (name: string, email: string, password: string, role: "STUDENT" | "TEACHER") => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  isHydrated: false,
  error: null,

  hydrate: async () => {
  const token = await getToken();
  let user = await getUser();

  // Right after a Fast Refresh, AsyncStorage's native bridge can occasionally
  // return null on the very first read even though data exists on disk.
  // One short retry resolves it without affecting real cold-start performance.
  if (token && !user) {
    await new Promise((r) => setTimeout(r, 150));
    user = await getUser();
  }

  set({ user: token ? user : null, isHydrated: true });
},

  login: async (email, password, role) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.post("/api/auth/mobile-login", { email, password, role });
      await saveToken(data.token);
      await saveUser(data.user);
      set({ user: data.user, isLoading: false });
      if (data.user.role === "TEACHER") {
        useUIStore.getState().setViewMode("teacher");
      }
    } catch (err: any) {
      set({ isLoading: false, error: err.response?.data?.error || "Login failed" });
      throw err;
    }
  },

  register: async (name, email, password, role) => {
    set({ isLoading: true, error: null });
    try {
      await api.post("/api/auth/register", { name, email, password, role });
      const { data } = await api.post("/api/auth/mobile-login", { email, password, role });
      await saveToken(data.token);
      await saveUser(data.user);
      set({ user: data.user, isLoading: false });
    } catch (err: any) {
      set({ isLoading: false, error: err.response?.data?.error || "Registration failed" });
      throw err;
    }
  },

  logout: async () => {
    await clearAuth();
    set({ user: null });
  },
}));

// Register once, outside the store definition — called by lib/api.ts whenever
// a request comes back 401, without api.ts needing to import this file
// (avoids the require-cycle: authStore -> api -> authStore).
registerUnauthorizedHandler(() => {
  useAuthStore.getState().logout();
});