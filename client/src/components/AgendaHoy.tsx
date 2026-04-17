export default function AgendaHoy() {
  const events = [
    { time: "08:00", title: "Desayuno de Escuadrón", bgClass: "" },
    { time: "09:00", title: "Reunión de Tácticas", bgClass: "bg-primary text-white" },
    { time: "10:00", title: "Patrulla de Perímetro", bgClass: "" },
    { time: "11:00", title: "--", bgClass: "" },
    { time: "12:00", title: "Almuerzo", bgClass: "" },
    { time: "13:00", title: "Entrenamiento Espada", bgClass: "bg-[#fac901]" },
    { time: "14:00", title: "Reunión con Jaime", bgClass: "" },
    { time: "15:00", title: "Descanso", bgClass: "", isLast: true },
  ];

  return (
    <div className="flex-1 flex flex-col">
      <div className="px-6 py-3 bg-secondary border-b-neo-thick">
        <h4 className="text-white text-2xl font-black uppercase">Agenda Hoy</h4>
      </div>
      
      {/* Time Slots */}
      <div className="flex flex-col">
        {events.map((evt, i) => (
          <div key={i} className={`flex ${evt.isLast ? 'border-b-neo-thick' : 'border-b-neo'} bg-white group`}>
            <div className="w-20 p-4 border-r-neo font-label font-bold text-sm bg-white group-hover:bg-[#fac901] transition-colors">
              {evt.time}
            </div>
            <div className={`flex-1 p-4 font-bold uppercase flex items-center ${evt.bgClass}`}>
              {evt.title}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Aesthetic */}
      <div className="flex-1 bg-white p-8">
        <div className="border-neo-thick w-full h-full flex items-center justify-center min-h-[160px]">
          <span className="material-symbols-outlined text-9xl">shield</span>
        </div>
      </div>
    </div>
  );
}
