import { useEffect } from 'react';
import { create } from 'zustand';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import AgendaHoy from './components/AgendaHoy';
import TaskFeed from './components/TaskFeed';
import MiniCalendar from './components/MiniCalendar';

// Ejemplo de estado global UI local con Zustand.
// Minimalista y directo sin Context Providers.
interface AppState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
}

const useAppStore = create<AppState>((set) => ({
  sidebarOpen: false,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}));

function App() {
  const { sidebarOpen, toggleSidebar } = useAppStore();

  return (
    <>
      <Header />
      {/* Usamos h-screen para que el viewport sea fijo y los hijos con overflow-y-auto funcionen. 
          El pt-14 compensa el header fixed de altura h-14 (56px). */}
      <div className="flex bg-surface w-full h-screen pt-14 border-t-8 border-black">
        <Sidebar />
        
        {/* main container con h-full (que ahora es h-screen menos pt-14) */}
        <main className="flex-1 grid grid-cols-12 h-full border-l-8 border-black overflow-hidden">
          
          <TaskFeed />
          
          {/* Right Panel: Calendar & Agenda (4 columns) */}
          <aside className="col-span-4 bg-surface-container flex flex-col overflow-y-auto">
            {/* Widget Mini-Calendario funcional  */}
            <MiniCalendar />
            
            <AgendaHoy />
          </aside>
        </main>
      </div>
    </>
  );
}

export default App;
