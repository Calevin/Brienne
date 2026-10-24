# Plan Técnico — saneamiento_linter_cliente (Spec 001)

- **Spec Origen:** `specs/001_saneamiento_linter_cliente_spec.md`
- **Verificador Asociado:** `specs/001_saneamiento_linter_cliente_verificador.md`
- **Estado:** `PLANIFICADO`

## 1. Resumen Arquitectónico y Aislamiento de Lógica

El análisis estático actual en `client` reporta 5 errores derivados de violaciones a las reglas de hooks de React 19 y convenciones de TypeScript:
1. `react-hooks/set-state-in-effect` en `TaskModal.tsx`: Un hook `useEffect` reacciona a cambios en `[isOpen, selectedTaskId, tasks]` y ejecuta de forma síncrona 7 mutaciones de estado (`setTitle`, `setDetail`, `setPoints`, `setAssignee`, `setDateStr`, `setTimeStr`, `setMode`), lo que genera renders en cascada y rompe la predictibilidad del ciclo de vida.
2. `@typescript-eslint/no-explicit-any` en `TaskModal.tsx` (líneas 78 y 98): Conversión forzada de `points` mediante `points as any` en el despacho de mutaciones de creación y edición.
3. `@typescript-eslint/no-unused-vars` en `client/tests/tasks.spec.ts` (líneas 60 y 219): Variables declaradas `modalHeading` y `sectionHoy` que nunca son consumidas ni afirmadas.

**Solución Arquitectónica:**
- **Inicialización Declarativa de Formulario (React 19):** Extraer el contenido y estado del formulario del modal hacia un subcomponente interno `TaskModalContent` (o keyed component) que reciba la tarea activa `task` y el modo inicial. Al usar una clave reactiva `key={selectedTaskId ?? 'create'}`, React desmonta y vuelve a montar el componente cuando cambia la tarea seleccionada o se abre para una nueva tarea, permitiendo inicializar los estados directamente en `useState` sin necesidad de ningún `useEffect` ni llamadas síncronas a `setState`.
- **Tipado Fuerte de Dominio:** Importar el tipo canónico `Task` desde `@brienne/shared` y definir el estado y payload de `points` como `Task['points']` (restringido a los valores Fibonacci permitidos por el esquema Zod), eliminando cualquier uso de `any`.
- **Aserción en Tests E2E:** En `client/tests/tasks.spec.ts`, utilizar `modalHeading` y `sectionHoy` en aserciones explícitas de visibilidad (`await expect(modalHeading).toBeVisible()`), resolviendo las violaciones de linting y fortaleciendo la verificación funcional de la UI.

## 2. Mapa de Archivos a Crear o Modificar

| Archivo / Ruta | Acción (`CREAR` / `MODIFICAR`) | Responsabilidad Técnica | Requisitos Cubiertos (`RF-XX`) |
| :--- | :--- | :--- | :--- |
| `client/src/components/TaskModal.tsx` | `MODIFICAR` | Reemplazar sincronización por `useEffect` con inicialización declarativa basada en clave/props y tipar `points` estrictamente con `Task['points']` | `RF-01`, `RF-02`, `RF-03`, `RF-04`, `RF-05` |
| `client/tests/tasks.spec.ts` | `MODIFICAR` | Agregar aserciones de visibilidad para las variables declaradas `modalHeading` y `sectionHoy` | `RF-01`, `RF-02` |

## 3. Contratos, Firmas y Modelo de Datos

Uso de contratos compartidos desde `@brienne/shared`:
```typescript
import type { Task } from '@brienne/shared';

// Tipo de puntos derivado del contrato canónico (escala Fibonacci)
type TaskPoints = Task['points'];

// Firma del componente de contenido del modal con ciclo de vida gobernado por clave
interface TaskModalContentProps {
  task: Task | null;
  onClose: () => void;
}
```

Estructura de inicialización de estado en `TaskModalContent`:
```typescript
// Sin useEffect para sincronización:
const [mode, setMode] = useState<'create' | 'view' | 'edit' | 'delete_confirm'>(task ? 'view' : 'create');
const [title, setTitle] = useState(task?.title ?? '');
const [detail, setDetail] = useState(task?.detail ?? '');
const [points, setPoints] = useState<TaskPoints>((task?.points as TaskPoints) ?? 1);
const [assignee, setAssignee] = useState(task?.assignedTo?.[0] ?? '');
const [dateStr, setDateStr] = useState(() => (task?.dueDate ? formatISODate(task.dueDate) : ''));
const [timeStr, setTimeStr] = useState(() => (task?.dueDate ? formatISOTime(task.dueDate) : ''));
```

## 4. Decisiones Técnicas Justificadas

- **Decisión 1: Inicialización declarativa mediante subcomponente con `key` en lugar de `useEffect` con `setState` manual.**
  - *Alternativa descartada:* Desactivar la regla `react-hooks/set-state-in-effect` con comentarios `// eslint-disable-next-line`. Descartada absolutamente porque viola la Constitución (anti-reward-hacking y prohibición explícita de `react-hooks/set-state-in-effect` en Sección D).
- **Decisión 2: Tipado estricto con `Task['points']` importado de `@brienne/shared`.**
  - *Alternativa descartada:* Desactivar la regla `@typescript-eslint/no-explicit-any` en la configuración de ESLint. Descartada por violar RNF-01 y degradar la seguridad de tipos del monorepo.
- **Decisión 3: Incorporar aserciones de visibilidad sobre `modalHeading` y `sectionHoy` en los tests de Playwright.**
  - *Alternativa descartada:* Eliminar las variables o renombrarlas con prefijo `_`. Descartada porque verificar que el encabezado del modal y la sección de la agenda sean visibles agrega valor determinista a la validación de `RF-02`.

## 5. Secuencia de Tareas Atómicas (TDD: Test en Rojo -> Código -> Test en Verde)

_Regla para el Agente Implementador: Ejecuta UNA tarea a la vez en orden de dependencia. Primero verifica el estado de falla, luego escribe el código mínimo hasta pasar._

- [ ] **T1. Saneamiento de variables no utilizadas en suite E2E de Playwright** (`RF-01`, `RF-02`)
  - _Archivos:_ `client/tests/tasks.spec.ts`
  - _Hecho cuando:_ Se agregan las aserciones `await expect(modalHeading).toBeVisible()` y `await expect(sectionHoy).toBeVisible()`, reduciendo las infracciones de linting de 5 a 3.
- [ ] **T2. Tipado estricto de puntos de esfuerzo en mutaciones de tareas** (`RF-01`)
  - _Archivos:_ `client/src/components/TaskModal.tsx`
  - _Hecho cuando:_ Se reemplazan las aserciones `points as any` por el tipo `Task['points']` importado de `@brienne/shared`, reduciendo las infracciones de linting de 3 a 1.
- [ ] **T3. Refactorización reactiva sin efectos secundarios del formulario del modal** (`RF-01`, `RF-02`, `RF-03`, `RF-04`, `RF-05`)
  - _Archivos:_ `client/src/components/TaskModal.tsx`
  - _Hecho cuando:_ Se extrae la estructura interna a un subcomponente gobernado por `key={selectedTaskId ?? 'create'}` eliminando el `useEffect` que causa `react-hooks/set-state-in-effect`, logrando que `direnv exec . pnpm --filter client lint` termine con código de salida `0` (`CHK-01` en verde).
- [ ] **T4. Verificación integral de no regresión y sellado de la tarea** (`RF-01`, `RF-02`, `RF-03`, `RF-04`, `RF-05`)
  - _Archivos:_ `client/src/components/TaskModal.tsx`, `client/tests/tasks.spec.ts`
  - _Hecho cuando:_ El comando `.seb/bin/seb verify saneamiento_linter_cliente` reporta el 100% de los controles (`CHK-01` a `CHK-99`) en estado `[PASA]`.
