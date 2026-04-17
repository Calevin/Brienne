import { useTasksQuery } from "../hooks/useTasks";
import { useUIStore } from "../store/uiStore";

export default function AgendaHoy() {
  const { data: tasks, isLoading, isError } = useTasksQuery();
  const openTaskModal = useUIStore(state => state.openTaskModal);

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col">
        <div className="px-6 py-3 bg-secondary border-b-neo-thick">
          <h4 className="text-white text-2xl font-black uppercase">Agenda Hoy</h4>
        </div>
        <div className="flex-1 bg-white p-8 flex items-center justify-center font-bold">
           CARGANDO...
        </div>
      </div>
    );
  }

  if (isError) {
    return (
       <div className="flex-1 flex flex-col">
        <div className="px-6 py-3 bg-[#ff1e01] border-b-neo-thick">
          <h4 className="text-white text-2xl font-black uppercase">Agenda Hoy (ERR)</h4>
        </div>
      </div>
    );
  }

  // Paleta de colores neo-brutalista cíclica
  const PALETTE = [
    "bg-primary text-white",     // Azul principal
    "bg-[#fac901] text-black",   // Amarillo 
    "bg-[#ff1e01] text-white",   // Rojo
    "bg-black text-white"        // Negro
  ];

  const now = new Date();
  const startHourBase = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() - 2, 0, 0);

  const events = Array.from({ length: 8 }).map((_, i) => {
    const slotTime = new Date(startHourBase.getTime() + i * 60 * 60 * 1000);
    const timeString = `${slotTime.getHours().toString().padStart(2, '0')}:00`;
    
    const targetYear = slotTime.getFullYear();
    const targetMonth = slotTime.getMonth();
    const targetDate = slotTime.getDate();
    const targetHour = slotTime.getHours();

    const taskForSlot = tasks?.find(task => {
      if (!task.dueDate) return false;
      const dueDate = new Date(task.dueDate);
      return (
        dueDate.getFullYear() === targetYear &&
        dueDate.getMonth() === targetMonth &&
        dueDate.getDate() === targetDate &&
        dueDate.getHours() === targetHour
      );
    });

    const bgClass = taskForSlot ? PALETTE[i % PALETTE.length] : "";

    return {
      time: timeString,
      title: taskForSlot?.title || "--",
      bgClass,
      isLast: i === 7,
      taskId: taskForSlot?.id,
      isCompleted: taskForSlot?.completed
    };
  });

  return (
    <div className="flex-1 flex flex-col">
      <div className="px-6 py-3 bg-secondary border-b-neo-thick">
        <h4 className="text-white text-2xl font-black uppercase">Agenda Hoy</h4>
      </div>
      
      {/* Time Slots */}
      <div className="flex flex-col">
        {events.map((evt, i) => (
          <div 
            key={i} 
            className={`flex ${evt.isLast ? 'border-b-neo-thick' : 'border-b-neo'} bg-white group ${evt.taskId ? 'cursor-pointer hover:-translate-y-1 transition-transform' : ''}`}
            onClick={() => evt.taskId && openTaskModal(evt.taskId)}
          >
            <div className={`w-20 p-4 border-r-neo font-label font-bold text-sm bg-white group-hover:bg-[#fac901] transition-colors ${evt.isCompleted ? 'opacity-50 text-black/50' : 'text-black'}`}>
              {evt.time}
            </div>
            <div className={`flex-1 p-4 font-bold uppercase flex items-center ${evt.bgClass} ${evt.isCompleted ? 'opacity-70' : ''}`}>
              <span className={evt.isCompleted ? 'line-through decoration-4 decoration-black/80' : ''}>{evt.title}</span>
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
