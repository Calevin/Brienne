import TaskCard from "./TaskCard";

export default function TaskFeed() {
  const hoyTasks = [
    {
      category: "CRÍTICO",
      categoryTheme: "critical" as const,
      title: "Custodia de los Septentrionales en el Muro",
      assignee: "Usuario",
      imgUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuCI08vF1l2-MVljZYmGIRkG8vVx-v7YPtcBJFS8hJE9lpl1MNqQsh0SFFsRlOwbmEdVwd1TALlSvuZEsLBwGCz-UshP5knue8fy4tHvEnaec_Vpt_HisfbbNf5HCQgOsbFsNy07TnZnx-iONXGTN13nSHZKJmwrxMMxEMexxO6iRdN3c0qHklMwo1KpdL0GsShbIhuT4IK1IA8A2I9PIiyB5B9OxWKGh2IS9rXCn2w-J7PG2J0IDZrbMLYyxhimmBtII7xop_i-OaJX",
    },
    {
      category: "PERSONAL",
      categoryTheme: "personal" as const,
      title: "Mantenimiento de Armadura y Equipamiento",
      assignee: "Novia",
      imgUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAncaV92OyMiqsIuGwEpl3iKv5CX1U9yNEx-h_9HFoX45gJBnjeHf5Lv-2G9Cz7Ggn1HoQacCwnY9eweUYZBL0o9FTbRVZCpxArU6IOXTDu9bK5ayeis6uRoyPr0TZ9e4Xx5u8ZckbwTaqwhU9VTnPPfvN7kIK-ipUH-zEyhzHiS8crDYWB0hRHe7BSPKu3s6bNtV3vnuErtmevLS76vNbWrUgKrsf6QPGMnPxMcuoIUbAxkHs6mvFyApIimzMdUQA-I4jNX9Jv8rm-",
    },
  ];

  const otrasTasks = [
    { category: "LOGÍSTICA", categoryTheme: "regular" as const, title: "Revisión de Provisiones del Cuartel", assignee: "Administración" },
    { category: "DIPLOMACIA", categoryTheme: "yellow" as const, title: "Audiencia con el Consejo de Guardianes", assignee: "Usuario" },
    { category: "ENTRENAMIENTO", categoryTheme: "regular" as const, title: "Práctica de duelo a espada", assignee: "Podrick" },
    { category: "GUARDIA", categoryTheme: "critical" as const, title: "Vigilancia de los aposentos reales", assignee: "Guardia Real" },
    { category: "MANTENIMIENTO", categoryTheme: "regular" as const, title: "Limpieza de armería y afilado", assignee: "Podrick" },
    { category: "GUARDIA", categoryTheme: "critical" as const, title: "Ronda nocturna en la Fortaleza Roja", assignee: "Comandante" },
    { category: "PERSONAL", categoryTheme: "personal" as const, title: "Redacción de cartas a Tarth", assignee: "Familia" },
    { category: "LOGÍSTICA", categoryTheme: "regular" as const, title: "Inventario de monturas y establos", assignee: "Maestro de Caballos" },
  ];

  return (
    <section className="col-span-8 border-r-8 border-black bg-white overflow-y-auto">
      {/* Sección Hoy */}
      <div className="grid grid-cols-2">
        <div className="col-span-2 px-6 py-3 border-b-8 border-black flex justify-between items-center bg-[#fac901]">
          <h2 className="text-3xl font-black uppercase text-black">Hoy</h2>
          <span className="font-label bg-black text-white px-4 py-1">{hoyTasks.length} TAREAS</span>
        </div>
        
        {hoyTasks.map((t, index) => (
          <TaskCard 
            key={index} 
            {...t} 
            hasRightBorder={index % 2 === 0} 
          />
        ))}
      </div>

      {/* Sección Otras tareas */}
      <div className="grid grid-cols-2">
        <div className="col-span-2 px-6 py-3 bg-black border-b-8 border-black flex justify-between items-center">
          <h2 className="text-3xl font-black uppercase text-white">Otras Tareas</h2>
          <span className="font-label text-black px-4 py-1 bg-[#fac901]">{otrasTasks.length} TAREAS</span>
        </div>

        {otrasTasks.map((t, index) => (
          <TaskCard 
            key={index} 
            {...t} 
            hasRightBorder={index % 2 === 0} 
          />
        ))}
      </div>

      {/* Empty Aesthetic Block final del diseño */}
      <div className="h-64 bg-white border-b-8 border-black"></div>
    </section>
  );
}
