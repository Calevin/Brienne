## Flujo: Obtener tareas y mostrarlas en el dashboard

Describe el recorrido completo de datos desde la base de datos hasta los componentes del dashboard.
Se distingue entre dependencias externas (react-query, mongoose, date-fns) y clases propias del proyecto.

---

### Contexto: Monorepo y tipos compartidos

El proyecto usa una estructura de monorepo con tres workspaces:

- `client/` — app React (Vite)
- `server/` — API Express
- `shared/` — paquete `@brienne/shared` con tipos TypeScript y esquemas Zod compartidos

El tipo `Task` y el DTO `CreateTaskDTO` se definen en `shared/src/task.schema.ts` y se importan
tanto en el cliente como en el servidor. Esto garantiza que ambos extremos hablen el mismo contrato
sin duplicar definiciones.

---

### Contexto: Proxy de Vite

El cliente hace fetch a rutas relativas como `/api/tasks`. En desarrollo, Vite está configurado
con un proxy que redirige esas llamadas al servidor Express (puerto 3000). Esto evita problemas
de CORS en desarrollo y no requiere hardcodear la URL del servidor en el cliente.

---

### Frontend (Workspace Client)

**1. `client/src/components/TaskFeed.tsx`**

Punto de entrada del flujo. Al montarse, invoca el hook `useTasksQuery` (dependencia propia):

```ts
const { data: tasks, isLoading, isError } = useTasksQuery();
```

`isLoading` e `isError` son valores que devuelve react-query (dependencia externa).
Mientras `isLoading` es `true`, se muestra un estado de carga. Si `isError` es `true`,
se muestra un panel de error. Ambos estados impiden que el componente intente renderizar
datos que aún no existen.

---

**2. `client/src/hooks/useTasks.ts`** (clase propia)

Encapsula la lógica de react-query para el recurso `Task`:

```ts
// useQuery es de @tanstack/react-query (dependencia externa)
// Task es de @brienne/shared (dependencia propia — paquete compartido del monorepo)
export const useTasksQuery = () => {
  return useQuery<Task[], Error>({
    queryKey: TASK_KEYS.all, // ver nota sobre TASK_KEYS
    queryFn: getTasks,       // ver paso 3
  });
};

// TASK_KEYS centraliza las cache keys de react-query.
// Permite invalidar o refetchear la lista de tareas desde cualquier parte
// del árbol de componentes de forma consistente.
export const TASK_KEYS = {
  all: ['tasks'] as const,
};
```

react-query ejecuta `getTasks` al montar, gestiona el estado de carga y error,
y cachea el resultado bajo la key `['tasks']`.

---

**3. `client/src/api/tasksApi.ts`** (clase propia)

Realiza el request HTTP al backend. Usa `fetch` nativo (sin librería adicional):

```ts
// BASE_URL es relativa. Vite la proxea a http://localhost:3000/api/tasks en desarrollo.
const BASE_URL = '/api/tasks';

// Task es de @brienne/shared
export const getTasks = async (): Promise<Task[]> => {
  const response = await fetch(BASE_URL);
  if (!response.ok) {
    throw new Error('Failed to fetch tasks');
  }
  return response.json();
};
```

Si la respuesta no es `ok` (status >= 400), lanza un error. react-query lo captura
y activa el estado `isError` en el hook.

---

### Backend (Workspace Server)

**4. `server/src/index.ts`**

Registra el router de tareas bajo el prefijo `/api/tasks`:

```ts
import taskRoutes from './routes/task.routes';
// ...
app.use('/api/tasks', taskRoutes);
```

El servidor espera a conectarse a MongoDB antes de comenzar a escuchar peticiones.
Si la conexión falla, el proceso termina con `process.exit(1)`.

---

**5. `server/src/routes/task.routes.ts`** (clase propia)

Asocia los verbos HTTP con las funciones del controller.
El `Router` es de Express (dependencia externa):

```ts
import { Router } from 'express';
import { getTasks, createTask, updateTask, deleteTask } from '../controllers/task.controller';

const router = Router();

router.get('/', getTasks);       // ver paso 6
router.post('/', createTask);
router.patch('/:id', updateTask);
router.delete('/:id', deleteTask);

export default router;
```

---

**6. `server/src/controllers/task.controller.ts`** (clase propia)

Maneja la lógica del endpoint GET. `Request` y `Response` son de Express (dependencia externa):

```ts
export const getTasks = async (req: Request, res: Response) => {
  try {
    const tasks = await TaskModel.find().lean(); // TaskModel: ver paso 7
    res.json(tasks.map(mapToTaskResponse));      // mapToTaskResponse: ver nota abajo
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Error fetching tasks' });
  }
};
```

**`mapToTaskResponse`** (función propia del controller):

```ts
function mapToTaskResponse(doc: any) {
  const { _id, __v, ...rest } = doc;
  return {
    id: _id.toString(), // Convierte ObjectId de MongoDB al string 'id' del tipo Task
    ...rest
  };
}
```

Mongoose devuelve documentos con `_id` (ObjectId) y `__v` (version key).
Esta función los normaliza al contrato del tipo `Task` de `@brienne/shared`,
que usa `id` como string. Se usa `.lean()` para obtener objetos JS planos
en lugar de instancias de documento Mongoose, lo que mejora el rendimiento.

---

**7. `server/src/models/Task.ts`** (clase propia)

Define el schema de Mongoose y exporta el modelo:

```ts
import mongoose, { Schema } from 'mongoose'; // mongoose: dependencia externa
import { Task } from '@brienne/shared';       // Task: tipo del paquete compartido

// TaskSchema define la estructura del documento en MongoDB.
// Al tiparlo con <Task>, TypeScript valida que los campos del schema
// sean compatibles con el tipo compartido.
const TaskSchema = new Schema<Task>({
  title:      { type: String,  required: true },
  points:     { type: Number,  required: true, enum: [0, 1, 2, 3, 5, 8, 13, 21] },
  assignedTo: { type: [String], default: [] },
  ownerId:    { type: String,  required: true },
  recurrence: { type: String,  default: null },
  dueDate:    { type: Date,    default: null },
  completed:  { type: Boolean, default: false }
}, {
  timestamps: true // Mongoose agrega createdAt y updatedAt automáticamente
});

export const TaskModel = mongoose.model<Task>('Task', TaskSchema);
```

---

### Frontend (Vuelta)

**8. `client/src/components/TaskFeed.tsx`** (donde comenzó todo)

Con los datos ya disponibles, el componente los filtra en cuatro secciones.
`isToday`, `isBefore` y `startOfDay` son de `date-fns` (dependencia externa):

```ts
const allTasks = tasks || [];
const today = startOfDay(new Date());

// Tareas de hoy, incompletas
const hoyTasks = allTasks.filter(t =>
  !t.completed && t.dueDate && isToday(new Date(t.dueDate))
);

// Tareas sin fecha o con fecha futura (no hoy), incompletas.
// Ordenadas por proximidad: primero las con fecha más cercana, al final las sin fecha.
const otrasTasks = allTasks.filter(t => {
  if (t.completed) return false;
  if (!t.dueDate) return true;
  const d = new Date(t.dueDate);
  return !isToday(d) && !isBefore(d, today);
}).sort((a, b) => { /* fecha ascendente, nulls al final */ });

// Tareas marcadas como completadas (sin importar fecha)
const completadasTasks = allTasks.filter(t => t.completed);

// Tareas incompletas con fecha anterior a hoy
const pasadasTasks = allTasks.filter(t => {
  if (t.completed || !t.dueDate) return false;
  const d = new Date(t.dueDate);
  return !isToday(d) && isBefore(d, today);
});
```

Las secciones "Otras tareas" y "Tareas pasadas" solo se renderizan si tienen elementos.
"Hoy" y "Completadas" siempre se muestran (pueden estar vacías).

Cada `TaskCard` recibe un `onClick` que llama a `openTaskModal` de `useUIStore`
(store de Zustand, dependencia propia). Esto abre el modal de detalle de tarea
pasando el `id` de la tarea seleccionada:

```tsx
<TaskCard
  key={t.id!}
  title={t.title}
  onClick={() => openTaskModal(t.id!)} // abre el modal vía Zustand
/>
```

---

**9. `client/src/components/TaskCard.tsx`** (clase propia)

Componente de presentación puro. Recibe las props de la tarea y el callback `onClick`.
No tiene estado propio ni acceso a queries. Se reutiliza en `TaskFeed.tsx`
y en `AgendaHoy.tsx` (que también muestra las tareas del día en una vista de agenda horaria).