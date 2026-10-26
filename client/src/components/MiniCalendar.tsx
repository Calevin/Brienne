import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  isSameMonth,
  isSameDay,
  addDays
} from 'date-fns';
import { es } from 'date-fns/locale';
import { useUIStore } from '../store/uiStore';

export default function MiniCalendar() {
  const selectedDate = useUIStore((state) => state.selectedDate);
  const setSelectedDate = useUIStore((state) => state.setSelectedDate);
  const calendarViewDate = useUIStore((state) => state.calendarViewDate);
  const prevMonth = useUIStore((state) => state.prevMonth);
  const nextMonth = useUIStore((state) => state.nextMonth);

  const today = new Date();

  // Logica de construccion de la grilla mensual segun el mes visualizado
  const monthStart = startOfMonth(calendarViewDate);
  const monthEnd = endOfMonth(monthStart);

  // La semana comienza en lunes (weekStartsOn: 1) segun configuracion regional
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
      const isSelected = isSameDay(day, selectedDate);
      const dayFormatted = format(day, 'yyyy-MM-dd');
      const currentDayInstance = day;

      let colorClasses = "hover:bg-surface-container cursor-pointer";
      if (isToday && isSelected) {
        // Coincidencia Hoy y Seleccionado: fondo negro con marco amarillo neoplástico grueso
        colorClasses = "bg-black text-white border-4 border-[#fac901] font-bold";
      } else if (isSelected) {
        // Seleccionado distinto a hoy: fondo amarillo neoplástico y texto negro
        colorClasses = "bg-[#fac901] text-black font-bold";
      } else if (isToday) {
        // Hoy no seleccionado: fondo negro sólido y texto blanco
        colorClasses = "bg-black text-white font-bold";
      }

      days.push(
        <button
          key={day.toString()}
          type="button"
          data-testid={`calendar-day-${dayFormatted}`}
          aria-label={format(day, 'd MMMM yyyy', { locale: es })}
          onClick={() => setSelectedDate(currentDayInstance)}
          className={`p-2 transition-all aspect-square flex items-center justify-center font-label text-sm ${
            !isCurrentMonth ? "opacity-30" : ""
          } ${colorClasses}`}
        >
          {formattedDate}
        </button>
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

  // Encabezados de dias de la semana: L, M, X, J, V, S, D
  const daysOfWeek = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

  return (
    <div className="p-8 bg-white border-b-neo-thick shrink-0">
      <div className="flex justify-between items-center mb-6">
        {/* Titulo del mes en curso en mayusculas segun estetica Mondrian */}
        <h4 className="text-2xl font-black uppercase">
          {format(calendarViewDate, "MMMM", { locale: es })}
        </h4>
        <div className="flex gap-2">
          {/* Botones de navegacion de mes */}
          <button 
            type="button"
            onClick={prevMonth}
            className="bg-white text-black border-b-neo w-8 h-8 flex items-center justify-center hover:bg-[#fac901] transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <button 
            type="button"
            onClick={nextMonth}
            className="bg-white text-black border-b-neo w-8 h-8 flex items-center justify-center hover:bg-[#fac901] transition-all cursor-pointer"
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
