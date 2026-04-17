import { useEffect } from 'react';
import { create } from 'zustand';
import Header from './components/Header';
import Sidebar from './components/Sidebar';

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
          {/* Grilla 8/4 de la izquierda */}
          <div className="col-span-8 border-r-neo-thick bg-white p-6 overflow-y-auto">
            <h1 className="text-3xl font-black uppercase mb-4">Tareas de Hoy</h1>
            <p className="font-label">React Query estará aquí inyectando data pronto.</p>
          </div>
          
          {/* Agenda de la derecha */}
          <div className="col-span-4 bg-surface-container p-6 overflow-y-auto">
            <h2 className="text-2xl font-black uppercase mb-4">Calendario</h2>
            <div className="w-full h-64 bg-secondary border-neo flex items-center justify-center text-white font-bold">
              Date-fns Render Component
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

export default App;
