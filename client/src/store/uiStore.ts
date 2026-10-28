import { create } from 'zustand';
import { isSameMonth, startOfMonth, subMonths, addMonths } from 'date-fns';

export interface UIState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  isTaskModalOpen: boolean;
  selectedTaskId: string | null;
  openTaskModal: (taskId?: string) => void;
  closeTaskModal: () => void;

  // Modal de gestion de categorias (spec 005)
  isCategoryModalOpen: boolean;
  openCategoryModal: () => void;
  closeCategoryModal: () => void;

  // Estado temporal compartido (Spec 003)
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  calendarViewDate: Date;
  setCalendarViewDate: (date: Date) => void;
  prevMonth: () => void;
  nextMonth: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: false,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  isTaskModalOpen: false,
  selectedTaskId: null,
  openTaskModal: (taskId?: string) => set({ isTaskModalOpen: true, selectedTaskId: taskId || null }),
  closeTaskModal: () => set({ isTaskModalOpen: false, selectedTaskId: null }),
  isCategoryModalOpen: false,
  openCategoryModal: () => set({ isCategoryModalOpen: true }),
  closeCategoryModal: () => set({ isCategoryModalOpen: false }),

  // Inicialización en la fecha actual
  selectedDate: new Date(),
  calendarViewDate: new Date(),
  setSelectedDate: (date: Date) => set((state) => ({
    selectedDate: date,
    calendarViewDate: isSameMonth(date, state.calendarViewDate)
      ? state.calendarViewDate
      : startOfMonth(date),
  })),
  setCalendarViewDate: (date: Date) => set({ calendarViewDate: date }),
  prevMonth: () => set((state) => ({ calendarViewDate: subMonths(state.calendarViewDate, 1) })),
  nextMonth: () => set((state) => ({ calendarViewDate: addMonths(state.calendarViewDate, 1) })),
}));
