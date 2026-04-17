import { useUIStore } from '../store/uiStore';

export default function Sidebar() {
  const openTaskModal = useUIStore((state) => state.openTaskModal);

  return (
    <aside className="border-r-neo-thick bg-white flex flex-col items-center w-16 transition-all z-40 relative h-full">
      {/* Navigation Tabs */}
      <div className="w-full flex flex-col">
        <button 
          onClick={() => openTaskModal()}
          className="bg-white text-black border-b-neo w-full aspect-square flex items-center justify-center hover:bg-[#fac901] transition-all"
        >
          <span className="material-symbols-outlined scale-150">add_box</span>
        </button>
        <button className="bg-white text-black border-b-neo w-full aspect-square flex items-center justify-center hover:bg-[#fac901] transition-all">
          <span className="material-symbols-outlined scale-150" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
        </button>
        <button className="bg-white text-black border-b-neo w-full aspect-square flex items-center justify-center hover:bg-[#fac901] transition-all">
          <span className="material-symbols-outlined scale-150">hourglass_empty</span>
        </button>
        <button className="bg-white text-black border-b-neo w-full aspect-square flex items-center justify-center hover:bg-[#fac901] transition-all">
          <span className="material-symbols-outlined scale-150">person</span>
        </button>
        <button className="bg-white text-black border-b-neo w-full aspect-square flex items-center justify-center hover:bg-[#fac901] transition-all">
          <span className="material-symbols-outlined scale-150">emoji_events</span>
        </button>
      </div>

      <div className="mt-auto p-4 w-full border-t-neo-thick">
        <div className="bg-primary w-full aspect-square border-neo"></div>
      </div>
    </aside>
  );
}
