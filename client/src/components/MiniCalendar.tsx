import { useState } from 'react';
import {
  format,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  isSameMonth,
  isSameDay,
  addDays
} from 'date-fns';
import { es } from 'date-fns/locale';

export default function MiniCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const today = new Date();

  // Logica de navegacion de meses
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  // Logica de construccion de la grilla mensual
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  
  // Asumimos que la semana empieza en Lunes (weekStartsOn: 1)
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const dateFormat = "d";
  const rows = [];

  let days = [];
  let day = startDate;
  let formattedDate = "";

  while (day <= endDate) {
    for (let i = 0; i < 7; i++) {
      formattedDate = format(day, dateFormat);
      const isCurrentMonth = isSameMonth(day, monthStart);
      const isToday = isSameDay(day, today);

      days.push(
        <div
          className={`p-2 transition-all ${
            !isCurrentMonth ? "opacity-30" : ""
          } ${isToday ? "bg-black text-white font-bold" : "hover:bg-surface-container cursor-pointer"}`}
          key={day.toString()}
        >
          {formattedDate}
        </div>
      );
      day = addDays(day, 1);
    }
    
    rows.push(
      <div className="grid grid-cols-7 gap-2 text-center font-label font-medium" key={day.toString()}>
        {days}
      </div>
    );
    days = [];
  }

  // Encabezados de días de la semana: L, M, X, J, V, S, D
  const daysOfWeek = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

  return (
    <div className="p-8 bg-white border-b-neo-thick">
      <div className="flex justify-between items-center mb-6">
        {/* Utilizamos la localizacion española de date-fns */}
        <h4 className="text-2xl font-black uppercase">
          {format(currentDate, "MMMM", { locale: es })}
        </h4>
        <div className="flex gap-2">
          {/* Botones estilizados segun el diseño neo-plastico */}
          <button 
            onClick={prevMonth}
            className="bg-white text-black border-b-neo w-8 h-8 flex items-center justify-center hover:bg-[#fac901] transition-all"
          >
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <button 
            onClick={nextMonth}
            className="bg-white text-black border-b-neo w-8 h-8 flex items-center justify-center hover:bg-[#fac901] transition-all"
          >
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      </div>
      
      {/* Titulos Semanales */}
      <div className="grid grid-cols-7 gap-2 text-center mb-4 font-label font-bold text-xs">
        {daysOfWeek.map((d, index) => (
          <div key={index} className={index >= 5 ? "text-primary" : ""}>
            {d}
          </div>
        ))}
      </div>
      
      {/* Filas del Calendario */}
      <div className="flex flex-col gap-2">
        {rows}
      </div>
    </div>
  );
}
