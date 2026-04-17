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
      {/* Aplicamos top-14 (mt-14 equivalente) dado que el Header es fixed y h-14 */}
      <div className="flex bg-surface w-full h-[calc(100vh-56px)] mt-14 overflow-hidden">
        <Sidebar />
        
        {/* Main content placeholder basado en el Layout Mondrian */}
        <main className="flex-1 grid grid-cols-12 h-full overflow-hidden">
          
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
