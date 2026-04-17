import TaskCard from "./TaskCard";
import { useTasksQuery } from "../hooks/useTasks";
import { useUIStore } from "../store/uiStore";
import { isToday, isBefore, startOfDay } from "date-fns";

export default function TaskFeed() {
  const { data: tasks, isLoading, isError } = useTasksQuery();
  const openTaskModal = useUIStore(state => state.openTaskModal);

  if (isLoading) {
    return (
      <section className="col-span-8 border-r-8 border-black bg-white flex items-center justify-center h-full">
         <h2 className="text-3xl font-black uppercase">CARGANDO TAREAS...</h2>
      </section>
    );
  }

  if (isError) {
    return (
       <section className="col-span-8 border-r-8 border-black bg-white flex items-center justify-center p-8">
         <div className="bg-[#ff1e01] text-white p-8 border-8 border-black shadow-[16px_16px_0px_0px_rgba(0,0,0,1)]">
            <h2 className="text-3xl font-black uppercase mb-4">ERROR CATASTRÓFICO</h2>
            <p className="font-bold">No se pudo contactar al servidor o base de datos.</p>
         </div>
      </section>
    );
  }

  const allTasks = tasks || [];
  const today = startOfDay(new Date());

  const hoyTasks = allTasks.filter(t => !t.completed && t.dueDate && isToday(new Date(t.dueDate)));
  
  const otrasTasks = allTasks.filter(t => {
    if (t.completed) return false;
    if (!t.dueDate) return true; // sin fecha
    const d = new Date(t.dueDate);
    return !isToday(d) && !isBefore(d, today);
  }).sort((a, b) => {
    if (!a.dueDate && !b.dueDate) return 0;
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  const completadasTasks = allTasks.filter(t => t.completed);

  const pasadasTasks = allTasks.filter(t => {
    if (t.completed || !t.dueDate) return false;
    const d = new Date(t.dueDate);
    return !isToday(d) && isBefore(d, today);
  });

  // Helper para asignar colores estéticos basados en index/puntos (fines puramente cosméticos como The React Way requiere neo-brutalismo)
  const getRandomTheme = (id: string, index: number) => {
    const themes = ["critical", "personal", "yellow", "regular"];
    return themes[index % themes.length] as "critical" | "personal" | "yellow" | "regular";
  };

  return (
    <section className="col-span-8 border-r-8 border-black bg-white overflow-y-auto">
      {/* Sección Pendientes (Hoy) */}
      <div className="grid grid-cols-2">
        <div className="col-span-2 px-6 py-3 border-b-8 border-black flex justify-between items-center bg-[#fac901]">
          <h2 className="text-3xl font-black uppercase text-black">Hoy</h2>
          <span className="font-label bg-black text-white px-4 py-1">{hoyTasks.length} TAREAS</span>
        </div>
        
        {hoyTasks.map((t, index) => (
          <TaskCard 
            key={t.id!} 
            title={t.title} 
            category={`Pts: ${t.points}`} 
            categoryTheme={getRandomTheme(t.id!, index)}
            assignee={t.assignedTo?.[0] || 'N/A'}
            hasRightBorder={index % 2 === 0}
            onClick={() => openTaskModal(t.id!)}
          />
        ))}
      </div>

      {/* Sección Otras Tareas */}
      {otrasTasks.length > 0 && (
        <div className="grid grid-cols-2 border-t-8 border-black">
          <div className="col-span-2 px-6 py-3 border-b-8 border-black flex justify-between items-center bg-[#2250ce]">
            <h2 className="text-3xl font-black uppercase text-white">Otras tareas</h2>
            <span className="font-label bg-white text-black px-4 py-1">{otrasTasks.length} TAREAS</span>
          </div>
          
          {otrasTasks.map((t, index) => (
            <TaskCard 
              key={t.id!} 
              title={t.title} 
              category={`Pts: ${t.points}`} 
              categoryTheme={getRandomTheme(t.id!, index)}
              assignee={t.assignedTo?.[0] || 'N/A'}
              hasRightBorder={index % 2 === 0}
              onClick={() => openTaskModal(t.id!)}
            />
          ))}
        </div>
      )}

      {/* Sección Completadas */}
      <div className="grid grid-cols-2 border-t-8 border-black">
        <div className="col-span-2 px-6 py-3 bg-black border-b-8 border-black flex justify-between items-center">
          <h2 className="text-3xl font-black uppercase text-white">Completadas</h2>
          <span className="font-label text-black px-4 py-1 bg-[#fac901]">{completadasTasks.length} TAREAS</span>
        </div>

        {completadasTasks.map((t, index) => (
          <TaskCard 
            key={t.id!} 
            title={t.title}
             category={`Pts: ${t.points}`} 
             categoryTheme="regular"
            hasRightBorder={index % 2 === 0} 
            onClick={() => openTaskModal(t.id!)}
          />
        ))}
      </div>

      {/* Sección Tareas Pasadas */}
      {pasadasTasks.length > 0 && (
        <div className="grid grid-cols-2 border-t-8 border-black">
          <div className="col-span-2 px-6 py-3 border-b-8 border-black flex justify-between items-center bg-[#ff1e01]">
            <h2 className="text-3xl font-black uppercase text-white">Tareas pasadas</h2>
            <span className="font-label bg-white text-black px-4 py-1">{pasadasTasks.length} TAREAS</span>
          </div>
          
          {pasadasTasks.map((t, index) => (
            <TaskCard 
              key={t.id!} 
              title={t.title} 
              category={`Pts: ${t.points}`} 
              categoryTheme={getRandomTheme(t.id!, index)}
              assignee={t.assignedTo?.[0] || 'N/A'}
              hasRightBorder={index % 2 === 0}
              onClick={() => openTaskModal(t.id!)}
            />
          ))}
        </div>
      )}

      {/* Empty Aesthetic Block final del diseño */}
      <div className="h-64 bg-white border-b-8 border-black flex items-center justify-center opacity-20">
         <span className="material-symbols-outlined text-8xl">check_circle</span>
      </div>
    </section>
  );
}
