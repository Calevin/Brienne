import { useEffect } from 'react';
import { create } from 'zustand';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import AgendaHoy from './components/AgendaHoy';
import TaskFeed from './components/TaskFeed';
import MiniCalendar from './components/MiniCalendar';
import TaskModal from './components/TaskModal';

// Ejemplo de estado global UI local con Zustand.
// Minimalista y directo sin Context Providers.
interface AppState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  isTaskModalOpen: boolean;
  toggleTaskModal: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  sidebarOpen: false,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  isTaskModalOpen: false,
  toggleTaskModal: () => set((state) => ({ isTaskModalOpen: !state.isTaskModalOpen })),
}));

function App() {
  const { isTaskModalOpen, toggleTaskModal } = useAppStore();

  return (
    <>
      <Header />
      {/* Usamos h-screen para que el viewport sea fijo y los hijos con overflow-y-auto funcionen. 
          El pt-14 compensa el header fixed de altura h-14 (56px). */}
      <div className="flex bg-surface w-full h-screen pt-14 border-t-8 border-black">
        <Sidebar />
        
        {/* main container con h-full (que ahora es h-screen menos pt-14) */}
        <main className="flex-1 grid grid-cols-12 h-full border-l-8 border-black overflow-hidden relative">
          
          <TaskFeed />
          
          {/* Right Panel: Calendar & Agenda (4 columns) */}
          <aside className="col-span-4 bg-surface-container flex flex-col overflow-y-auto border-l-8 border-black">
            {/* Widget Mini-Calendario funcional  */}
            <MiniCalendar />
            
            <AgendaHoy />
          </aside>
        </main>
      </div>

      <TaskModal isOpen={isTaskModalOpen} onClose={toggleTaskModal} />
    </>
  );
}

export default App;
