# Plan Técnico — sincronizacion_calendario_agenda (Spec 003)

- **Spec Origen:** `specs/003_sincronizacion_calendario_agenda_spec.md`
- **Verificador Asociado:** `specs/003_sincronizacion_calendario_agenda_verificador.md`
- **Estado:** `PLANIFICADO`

## 1. Resumen Arquitectónico y Aislamiento de Lógica

La funcionalidad requiere sincronizar bidireccionalmente el componente mensual `MiniCalendar` y el timeline de franjas horarias `AgendaHoy`. Siguiendo la arquitectura del proyecto (`docs/constitution.md` Secciones B, C y D):

1. **Estado de Navegación Temporal en Zustand (`client/src/store/uiStore.ts`):**
   - El estado de la fecha seleccionada activa (`selectedDate: Date`) y su acción de mutación (`setSelectedDate: (date: Date) => void`) se alojan exclusivamente en `useUIStore`.
   - Se respeta la separación estricta: los datos de tareas residen en el Server State (TanStack Query vía `useTasksQuery`), mientras que el foco temporal y la navegación efímera residen en Zustand.

2. **Mini-Calendario Interactivo y Estética Mondrian (`MiniCalendar.tsx`):**
   - Consume `selectedDate` y `setSelectedDate` del store.
   - Sincroniza su vista mensual `currentDate` cuando `selectedDate` pertenece a un mes distinto (`RF-10`, `CL-02`).
   - Aplica los estilos cromáticos neoplásticos estrictos acordados:
     - Celda "Hoy" (no seleccionada): `bg-black text-white font-bold`.
     - Celda "Seleccionada" (distinta a hoy): `bg-[#fac901] text-black font-bold`.
     - Coincidencia "Hoy" + "Seleccionada": `bg-black text-white border-4 border-[#fac901] font-bold`.
     - Bordes sin redondeo (`border-radius: 0`) y bordes negros estructurales gruesos.

3. **Buffer Deslizante de 7 Días y Timeline Continuo (`AgendaHoy.tsx`):**
   - **Encabezado reactivo:** Renderiza dinámicamente `"AGENDA — HOY"` si `selectedDate` coincide con hoy, o `"AGENDA — <DÍA> <MES>"` en mayúsculas (ej. `"AGENDA — 26 OCT"`) si difiere (`RF-06`).
   - **Buffer continuo de 7 días:** En lugar de 8 slots rígidos, genera una secuencia consecutiva de 168 horas (3 días previos, el día seleccionado y 3 días posteriores). Esto permite un scroll continuo fluido cruzando medianoches sin necesidad de librerías externas de virtualización, respetando la prohibición constitucional de agregar dependencias al stack (`RF-04`).
   - **Apilamiento vertical de tareas:** Para cada franja horaria, filtra todas las tareas que vencen en ese año, mes, día y hora. Si hay múltiples tareas, las apila verticalmente expandiendo la altura de la fila (`RF-07`). Si no hay tareas, renderiza el indicador neutro `--` (`RF-09`).
   - **Navegación al hacer clic en el calendario (`RF-03`):** Al cambiar `selectedDate`, la agenda realiza un scroll programático automático: a 2 horas antes de la hora actual si es hoy; a la primera franja horaria con tareas o a las 08:00 si es otro día.
   - **Detección determinista de scroll (`RF-05`, `RNF-01`):** Mediante un listener sobre el contenedor desplazable (`scrollTop`), calcula cuál es la franja horaria que intersecta el margen superior visible. Si cruza las 00:00 a un nuevo día, actualiza `selectedDate` en el store. Para evitar bucles de renderizado o saltos espasmódicos, se utiliza una bandera transitoria `isProgrammaticScroll` que silencia el listener durante los scrolls automáticos.

## 2. Mapa de Archivos a Crear o Modificar

| Archivo / Ruta | Acción (`CREAR` / `MODIFICAR`) | Responsabilidad Técnica | Requisitos Cubiertos (`RF-XX`) |
| :--- | :--- | :--- | :--- |
| `client/src/store/uiStore.ts` | `MODIFICAR` | Agregar estado `selectedDate: Date` y acción `setSelectedDate` | `RF-01`, `RF-02`, `RF-03`, `RF-05`, `RF-06` |
| `client/src/components/MiniCalendar.tsx` | `MODIFICAR` | Integrar selección interactiva de días, sincronización de mes y estilos neoplásticos condicionales para Hoy y Seleccionado | `RF-01`, `RF-02`, `RF-03`, `RF-10` |
| `client/src/components/AgendaHoy.tsx` | `MODIFICAR` | Implementar encabezado dinámico, buffer de 7 días (168h), apilamiento de tareas, scroll automático por día y sincronización al cruzar 00:00 | `RF-03`, `RF-04`, `RF-05`, `RF-06`, `RF-07`, `RF-08`, `RF-09` |
| `client/tests/agenda-calendar.spec.ts` | `CREAR` | Suite de pruebas E2E deterministas en Playwright que valida estilos del calendario, sincronización bidireccional, scroll y apilamiento | `RF-01` a `RF-10`, `RNF-01`, `RNF-02`, `RNF-03` |

## 3. Contratos, Firmas y Modelo de Datos

### 3.1. Extensión de `UIState` en `client/src/store/uiStore.ts`

```typescript
export interface UIState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  isTaskModalOpen: boolean;
  selectedTaskId: string | null;
  openTaskModal: (taskId?: string) => void;
  closeTaskModal: () => void;

  // Estado temporal compartido (Spec 003)
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
}
```

### 3.2. Estructura de Datos para Franjas Horarias en `AgendaHoy.tsx`

```typescript
interface HourSlot {
  slotId: string;       // Identificador único determinista, ej: "slot-2026-10-26-14"
  date: Date;           // Fecha exacta de la hora
  dayKey: string;       // Clave de día YYYY-MM-DD
  hour: number;         // 0 a 23
  timeString: string;   // "14:00"
  tasks: Task[];        // Tareas que vencen en esta fecha y hora
}
```

### 3.3. Algoritmo de Generación del Buffer de 7 Días

```typescript
// Genera 7 días consecutivos (-3 a +3 días respecto a baseDate)
function generateWeekBufferSlots(baseDate: Date, tasks: Task[]): HourSlot[] {
  const slots: HourSlot[] = [];
  const startDay = addDays(startOfDay(baseDate), -3);

  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const currentDay = addDays(startDay, dayOffset);
    for (let h = 0; h < 24; h++) {
      const slotDate = new Date(currentDay.getFullYear(), currentDay.getMonth(), currentDay.getDate(), h);
      const matchingTasks = tasks.filter(t => {
        if (!t.dueDate) return false;
        const d = new Date(t.dueDate);
        return isSameDay(d, slotDate) && d.getHours() === h;
      });

      slots.push({
        slotId: `slot-${format(slotDate, 'yyyy-MM-dd-HH')}`,
        date: slotDate,
        dayKey: format(slotDate, 'yyyy-MM-dd'),
        hour: h,
        timeString: `${h.toString().padStart(2, '0')}:00`,
        tasks: matchingTasks,
      });
    }
  }
  return slots;
}
```

## 4. Decisiones Técnicas Justificadas

- **Decisión 1: Gestión de la fecha seleccionada en `uiStore.ts` (Zustand).**
  - *Alternativa descartada:* Prop drilling a través de `App.tsx` o un contexto de React dedicado.
  - *Justificación:* Conforme a `docs/constitution.md` Sección D, el estado transitorio de la UI se gestiona centralizadamente en Zustand. Esto desacopla `MiniCalendar` y `AgendaHoy` sin forzar re-renderizados de todo el layout de `App.tsx`.
- **Decisión 2: Buffer continuo estático de 7 días (168 franjas) sin virtualizadores externos.**
  - *Alternativa descartada:* Instalar `@tanstack/react-virtual` o `react-window`.
  - *Justificación:* `docs/constitution.md` Sección B prohíbe terminantemente agregar nuevas dependencias sin aprobación de arquitectura. Un listado de 168 elementos planos es ligero para el DOM de navegadores modernos y satisface la exigencia de scroll continuo bidireccional entre días.
- **Decisión 3: Bandera `isProgrammaticScroll` para aislar el listener de scroll.**
  - *Alternativa descartada:* Dejar el evento `onScroll` activo en todo momento.
  - *Justificación:* Al hacer clic en un día del calendario, la agenda se desplaza automáticamente hacia la hora objetivo. Si el evento `onScroll` se dispara durante esa animación, podría emitir una fecha intermedia no deseada y generar oscilaciones o bucles de renderizado infinito (`RNF-01`).

## 5. Secuencia de Tareas Atómicas (TDD: Test en Rojo -> Código -> Test en Verde)

- [x] **T1. Extender `uiStore` con `selectedDate` y sincronización visual neoplástica en `MiniCalendar`** (`RF-01`, `RF-02`, `RF-10`)
  - _Archivos:_ `client/src/store/uiStore.ts`, `client/src/components/MiniCalendar.tsx`, `client/tests/agenda-calendar.spec.ts`
  - _Hecho cuando:_ Los comandos `CHK-01` y `CHK-05` de `specs/003_sincronizacion_calendario_agenda_verificador.md` devuelven exit code `0`.
- [x] **T2. Encabezado dinámico y desplazamiento programático al seleccionar un día** (`RF-03`, `RF-06`)
  - _Archivos:_ `client/src/components/AgendaHoy.tsx`, `client/tests/agenda-calendar.spec.ts`
  - _Hecho cuando:_ El comando `CHK-02` de `specs/003_sincronizacion_calendario_agenda_verificador.md` devuelve exit code `0`.
- [x] **T3. Buffer de 7 días y sincronización reactiva al cruzar las 00:00 por scroll** (`RF-04`, `RF-05`)
  - _Archivos:_ `client/src/components/AgendaHoy.tsx`, `client/tests/agenda-calendar.spec.ts`
  - _Hecho cuando:_ El comando `CHK-03` de `specs/003_sincronizacion_calendario_agenda_verificador.md` devuelve exit code `0`.
- [x] **T4. Apilamiento vertical de múltiples tareas y apertura del modal de edición** (`RF-07`, `RF-08`, `RF-09`)
  - _Archivos:_ `client/src/components/AgendaHoy.tsx`, `client/tests/agenda-calendar.spec.ts`
  - _Hecho cuando:_ El comando `CHK-04` de `specs/003_sincronizacion_calendario_agenda_verificador.md` devuelve exit code `0`.
- [x] **T5. Saneamiento estático de tipos, linter y verificación global sin regresiones** (`RNF-01`, `RNF-02`, `RNF-03`)
  - _Archivos:_ Todos los archivos modificados.
  - _Hecho cuando:_ Los comandos `CHK-98` y `CHK-99` de `specs/003_sincronizacion_calendario_agenda_verificador.md` devuelven exit code `0`.
