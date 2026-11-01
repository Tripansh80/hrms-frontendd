import { create } from "zustand";

type UIState = {
  sidebarCollapsed: boolean;
  aiPanelOpen: boolean;
  tableDensity: "comfortable" | "compact";
  toggleSidebar: () => void;
  setAiPanelOpen: (open: boolean) => void;
  setTableDensity: (density: "comfortable" | "compact") => void;
};

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  aiPanelOpen: false,
  tableDensity: "comfortable",
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setAiPanelOpen: (open) => set({ aiPanelOpen: open }),
  setTableDensity: (density) => set({ tableDensity: density }),
}));
