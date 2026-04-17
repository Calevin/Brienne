import { useState } from 'react';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TaskModal({ isOpen, onClose }: TaskModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 md:p-12 bg-black/80 backdrop-blur-sm">
      {/* MONDRIAN MODAL */}
      <div className="bg-white w-full max-w-5xl border-8 border-black shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] relative flex flex-col md:flex-row max-h-[90vh] overflow-y-auto overflow-x-hidden">
        
        {/* Left Header Section (Asymmetric Branding) */}
        <div className="w-full md:w-20 bg-[#2250ce] border-b-8 md:border-b-0 md:border-r-8 border-black hidden md:flex items-center justify-center">
          <div className="rotate-[-90deg] whitespace-nowrap text-white font-black text-2xl tracking-[0.6em] uppercase">NUEVA TAREA</div>
        </div>

        {/* Main Form Section */}
        <div className="flex-1">
          {/* Close Button Cell */}
          <div className="flex justify-between items-center border-b-8 border-black px-8 py-6 bg-white">
            <span className="font-label font-bold uppercase tracking-[0.2em] text-xs opacity-60">MOD_ADD_TASK_001</span>
            <button 
              onClick={onClose}
              className="bg-black text-white w-12 h-12 flex items-center justify-center hover:bg-[#ff1e01] transition-colors border-2 border-black hover:scale-105"
            >
              <span className="material-symbols-outlined font-bold">close</span>
            </button>
          </div>

          <form className="grid grid-cols-1 md:grid-cols-12 text-black">
            {/* Title Input (Spans whole width) */}
            <div className="col-span-12 border-b-8 border-black p-8 bg-white">
              <label className="block font-black text-[10px] uppercase mb-4 tracking-[0.25em] text-black/50">Nombre de la Tarea</label>
              <input 
                className="w-full p-4 md:p-6 text-2xl md:text-3xl font-black uppercase tracking-tight bg-white border-4 border-black focus:border-[#2250ce] focus:outline-none focus:ring-0 placeholder:text-black/20" 
                placeholder="EJ: VIGILANCIA DE LOS PUERTOS" 
                type="text"
                autoFocus
              />
            </div>

            {/* Description Cell */}
            <div className="col-span-12 md:col-span-7 border-b-8 md:border-r-8 md:border-b-8 border-black p-8 bg-white">
              <label className="block font-black text-[10px] uppercase mb-4 tracking-[0.25em] text-black/50">Descripción (Opcional)</label>
              <textarea 
                className="w-full p-4 font-body text-base font-medium bg-white resize-none border-4 border-black focus:border-[#2250ce] focus:outline-none focus:ring-0 placeholder:text-black/20" 
                placeholder="DETALLES ESPECÍFICOS DEL JURAMENTO..." 
                rows={6}
              />
            </div>

            {/* Category & Points Cell */}
            <div className="col-span-12 md:col-span-5 border-b-8 border-black bg-white p-8 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjIiIGZpbGw9IiNlN2U3ZTciLz48L3N2Zz4=')]">
              <div className="mb-8">
                <label className="block font-black text-[10px] uppercase mb-4 tracking-[0.25em] text-black">Categoría</label>
                <div className="flex flex-wrap gap-2">
                  <button className="px-4 py-2 border-4 border-black bg-[#ff1e01] text-white font-black text-[11px] uppercase tracking-widest hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all" type="button">Doméstica</button>
                  <button className="px-4 py-2 border-4 border-black bg-white text-black font-black text-[11px] uppercase tracking-widest hover:bg-[#2250ce] hover:text-white hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all" type="button">Laboral</button>
                  <button className="px-4 py-2 border-4 border-black bg-white text-black font-black text-[11px] uppercase tracking-widest hover:bg-[#2250ce] hover:text-white hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all" type="button">Guardia</button>
                </div>
              </div>

              <div>
                <label className="block font-black text-[10px] uppercase mb-4 tracking-[0.25em] text-black">Puntos de Esfuerzo</label>
                <div className="grid grid-cols-4 lg:grid-cols-7 gap-2">
                  {[1, 2, 3, 5, 8, 13, 21].map((point) => (
                    <div key={point} className="aspect-square flex items-center justify-center border-4 border-black font-black text-sm cursor-pointer hover:bg-[#fac901] hover:text-black bg-white transition-colors">
                      {point}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Date & Time Cell */}
            <div className="col-span-12 md:col-span-6 border-b-8 md:border-b-0 md:border-r-8 border-black p-8 bg-white">
              <label className="block font-black text-[10px] uppercase mb-4 tracking-[0.25em] text-black/50">Fecha y Hora</label>
              <div className="grid grid-cols-2 gap-4">
                <input className="p-3 font-label text-sm font-bold border-4 border-black focus:outline-none focus:border-[#2250ce] bg-white" type="date" />
                <input className="p-3 font-label text-sm font-bold border-4 border-black focus:outline-none focus:border-[#2250ce] bg-white" type="time" />
              </div>
            </div>

            {/* Assignee Cell */}
            <div className="col-span-12 md:col-span-6 p-8 bg-[#fac901]">
              <label className="block font-black text-[10px] uppercase mb-4 tracking-[0.25em] text-black">Asignada a</label>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white border-4 border-black flex items-center justify-center text-black">
                  <span className="material-symbols-outlined">person</span>
                </div>
                <select className="flex-1 p-3 font-black uppercase text-xs tracking-[0.1em] bg-white border-4 border-black focus:outline-none focus:border-[#2250ce] cursor-pointer">
                  <option>JAIME LANNISTER</option>
                  <option>BRIENNE DE TARTH</option>
                  <option>JON SNOW</option>
                </select>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="col-span-12 border-t-8 border-black flex flex-col md:flex-row">
              <div className="flex-1 p-6 bg-white hidden md:block">
                <p className="font-label text-[10px] uppercase font-bold tracking-widest text-[#2250ce]">Sujeto al Código de Honor v.2.4</p>
              </div>
              <button 
                type="button"
                className="w-full md:w-auto px-12 py-6 bg-black text-[#fac901] font-black text-xl uppercase tracking-[0.2em] border-t-8 md:border-t-0 md:border-l-8 border-black hover:bg-[#2250ce] hover:text-white transition-colors flex items-center justify-center gap-4 group"
              >
                <span>GUARDAR</span>
                <span className="material-symbols-outlined !font-bold group-hover:rotate-12 transition-transform">check_box</span>
              </button>
            </div>
          </form>
        </div>

        {/* Asymmetric Accent Blocks (Mondrian signature) */}
        <div className="absolute -top-8 -right-8 w-16 h-16 bg-[#ff1e01] border-4 border-black z-[-1] hidden lg:block shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"></div>
        <div className="absolute -bottom-8 -left-8 w-16 h-16 bg-[#2250ce] border-4 border-black z-[-1] hidden lg:block shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"></div>
      </div>
    </div>
  );
}
