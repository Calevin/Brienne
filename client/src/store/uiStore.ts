import { create } from 'zustand';

interface UIState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  isTaskModalOpen: boolean;
  selectedTaskId: string | null;
  openTaskModal: (taskId?: string) => void;
  closeTaskModal: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: false,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  isTaskModalOpen: false,
  selectedTaskId: null,
  openTaskModal: (taskId?: string) => set({ isTaskModalOpen: true, selectedTaskId: taskId || null }),
  closeTaskModal: () => set({ isTaskModalOpen: false, selectedTaskId: null }),
}));
