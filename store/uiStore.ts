import { create } from "zustand";

interface UIState {
  viewMode: "student" | "teacher";
  setViewMode: (mode: "student" | "teacher") => void;
}

export const useUIStore = create<UIState>((set) => ({
  viewMode: "student",
  setViewMode: (mode) => set({ viewMode: mode }),
}));