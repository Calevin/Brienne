import { useState, useEffect, useRef, useMemo } from 'react';
import {
  format,
  isSameDay,
  addDays,
  startOfDay
} from 'date-fns';
import { es } from 'date-fns/locale';
import { useTasksQuery } from "../hooks/useTasks";
import { useUIStore } from "../store/uiStore";

export default function AgendaHoy() {
  const { data: tasks, isLoading, isError } = useTasksQuery();
  const openTaskModal = useUIStore((state) => state.openTaskModal);
  const selectedDate = useUIStore((state) => state.selectedDate);
  const setSelectedDate = useUIStore((state) => state.setSelectedDate);

  const containerRef = useRef<HTMLDivElement>(null);
  const isProgrammaticScrollRef = useRef(false);
  const isScrollDrivenChangeRef = useRef(false);

  // Anclaje de la ventana deslizante del buffer (evita re-renderizados y desplazamientos continuos de scroll)
  const [bufferAnchorDate, setBufferAnchorDate] = useState(() => startOfDay(selectedDate));

  // Si la fecha seleccionada se aleja mas de 3 dias de la ventana anclada, recentramos el buffer
  const daysDiff = Math.round((startOfDay(selectedDate).getTime() - bufferAnchorDate.getTime()) / (24 * 60 * 60 * 1000));
  if (Math.abs(daysDiff) > 3) {
    setBufferAnchorDate(startOfDay(selectedDate));
  }

  // Paleta neoplástica cíclica estricta (Mondrian)
  const PALETTE = [
    "bg-primary text-white",     // Azul (#2c4bdb)
    "bg-[#fac901] text-black",   // Amarillo
    "bg-[#ff1e01] text-white",   // Rojo
    "bg-black text-white"        // Negro
  ];

  // Calculo del encabezado dinamico segun la fecha seleccionada activa
  const isToday = isSameDay(selectedDate, new Date());
  const headerTitle = isToday
    ? "AGENDA — HOY"
    : `AGENDA — ${format(selectedDate, 'd MMM', { locale: es }).toUpperCase()}`;

  // Generacion del buffer continuo de 7 dias centrado en bufferAnchorDate (-3 a +3 dias = 168 horas)
  const slots = useMemo(() => {
    const list = [];
    const baseStart = addDays(bufferAnchorDate, -3);

    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const currentDay = addDays(baseStart, dayOffset);
      const dayKey = format(currentDay, 'yyyy-MM-dd');
      const dayLabel = format(currentDay, "EEEE d 'DE' MMMM", { locale: es }).toUpperCase();

      for (let h = 0; h < 24; h++) {
        const slotDate = new Date(currentDay.getFullYear(), currentDay.getMonth(), currentDay.getDate(), h);
        const hourStr = h.toString().padStart(2, '0');
        const timeString = `${hourStr}:00`;

        // Filtrado de todas las tareas que vencen en esta fecha y hora
        const matchingTasks = tasks?.filter((task) => {
          if (!task.dueDate) return false;
          const due = new Date(task.dueDate);
          return (
            due.getFullYear() === slotDate.getFullYear() &&
            due.getMonth() === slotDate.getMonth() &&
            due.getDate() === slotDate.getDate() &&
            due.getHours() === h
          );
        }) || [];

        list.push({
          slotId: `slot-${dayKey}-${hourStr}`,
          dayKey,
          dayLabel,
          hour: h,
          hourStr,
          slotDate,
          timeString,
          tasks: matchingTasks,
        });
      }
    }
    return list;
  }, [bufferAnchorDate, tasks]);

  // Posicionamiento programatico del scroll cuando cambia la fecha seleccionada desde el exterior
  useEffect(() => {
    // Si la fecha fue cambiada por el scroll manual del usuario, no reajustamos la posicion
    if (isScrollDrivenChangeRef.current) {
      isScrollDrivenChangeRef.current = false;
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    // Regla de posicionamiento (RF-03):
    // Si es hoy: 2 horas antes de la hora actual.
    // Si es otra fecha: primera hora con tareas o por defecto las 08:00.
    const dayKey = format(selectedDate, 'yyyy-MM-dd');
    let targetHour = 8;

    if (isSameDay(selectedDate, new Date())) {
      targetHour = Math.max(0, new Date().getHours() - 2);
    } else {
      const daySlots = slots.filter((s) => s.dayKey === dayKey);
      const firstSlotWithTask = daySlots.find((s) => s.tasks.length > 0);
      if (firstSlotWithTask) {
        targetHour = firstSlotWithTask.hour;
      }
    }

    const targetHourStr = targetHour.toString().padStart(2, '0');
    const targetElement = container.querySelector<HTMLElement>(`[data-testid="slot-${dayKey}-${targetHourStr}"]`);

    if (targetElement) {
      isProgrammaticScrollRef.current = true;
      targetElement.scrollIntoView({ behavior: 'auto', block: 'start' });

      const timer = setTimeout(() => {
        isProgrammaticScrollRef.current = false;
      }, 150);

      return () => clearTimeout(timer);
    }
  }, [selectedDate, slots]);

  // Manejador de scroll determinista para cruzar 00:00 y actualizar la fecha seleccionada
  const handleScroll = () => {
    if (isProgrammaticScrollRef.current) return;
    const container = containerRef.current;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const slotElements = container.querySelectorAll<HTMLElement>('[data-slot-date]');

    for (const el of slotElements) {
      const rect = el.getBoundingClientRect();
      // La franja focal es la que intersecta la linea de referencia superior del contenedor
      if (rect.top <= containerRect.top + 30 && rect.bottom > containerRect.top) {
        const slotDateStr = el.getAttribute('data-slot-date');
        if (slotDateStr) {
          const currentSelectedStr = format(selectedDate, 'yyyy-MM-dd');
          if (slotDateStr !== currentSelectedStr) {
            const [y, m, d] = slotDateStr.split('-').map(Number);
            const newDate = new Date(y, m - 1, d);
            isScrollDrivenChangeRef.current = true;
            setSelectedDate(newDate);
          }
        }
        break;
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col">
        <div className="px-6 py-3 bg-secondary border-b-neo-thick shrink-0">
          <h4 data-testid="agenda-header-title" className="text-white text-2xl font-black uppercase">
            {headerTitle}
          </h4>
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
        <div className="px-6 py-3 bg-[#ff1e01] border-b-neo-thick shrink-0">
          <h4 data-testid="agenda-header-title" className="text-white text-2xl font-black uppercase">
            AGENDA (ERR)
          </h4>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-white">
      {/* Encabezado reactivo de la agenda */}
      <div className="px-6 py-3 bg-secondary border-b-neo-thick shrink-0">
        <h4 data-testid="agenda-header-title" className="text-white text-2xl font-black uppercase">
          {headerTitle}
        </h4>
      </div>

      {/* Contenedor desplazable con las 168 franjas horarias */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        data-testid="agenda-scroll-container"
        className="flex-1 min-h-0 overflow-y-auto flex flex-col"
      >
        {slots.map((slot, index) => (
          <div key={slot.slotId} className="flex flex-col">
            {/* Separador de medianoche con el nombre del dia */}
            {slot.hour === 0 && (
              <div className="bg-black text-white px-4 py-1.5 font-label font-bold text-xs uppercase tracking-wider border-b-neo sticky top-0 z-10">
                {slot.dayLabel}
              </div>
            )}

            {/* Fila de franja horaria */}
            <div
              data-testid={slot.slotId}
              data-slot-date={slot.dayKey}
              data-slot-hour={slot.hour}
              className="flex border-b-neo bg-white group min-h-[56px]"
            >
              <div className="w-20 p-3 border-r-neo font-label font-bold text-sm bg-white group-hover:bg-[#fac901] transition-colors text-black flex items-center justify-center shrink-0">
                {slot.timeString}
              </div>

              {/* Contenido de la franja: tareas apiladas verticalmente o indicador neutro */}
              <div className="flex-1 p-2 flex flex-col gap-2 justify-center">
                {slot.tasks.length === 0 ? (
                  <span className="text-black/40 font-bold px-2 select-none">--</span>
                ) : (
                  slot.tasks.map((task, tIndex) => {
                    const bgClass = PALETTE[(index + tIndex) % PALETTE.length];
                    return (
                      <div
                        key={task.id}
                        onClick={() => openTaskModal(task.id)}
                        className={`p-2 font-bold uppercase cursor-pointer hover:-translate-y-0.5 transition-transform ${bgClass} ${
                          task.completed ? "opacity-70" : ""
                        }`}
                      >
                        <span className={task.completed ? "line-through decoration-4 decoration-black/80" : ""}>
                          {task.title}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
