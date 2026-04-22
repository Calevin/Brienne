## Flujo: Marcar tarea como completada ("Hecho")

Describe el recorrido completo desde que el usuario interactúa con el botón "Hecho" en el modal de detalle hasta que la tarea cambia de estado en la base de datos y la interfaz se actualiza para reflejar el cambio.

Se distingue entre dependencias externas (react-query, mongoose, express) y clases propias del proyecto.

---

### Contexto: Monorepo y tipos compartidos

El proyecto usa una estructura de monorepo donde el contrato de datos se define en el paquete `@brienne/shared`. La actualización de estado utiliza el tipo `Task` y permite actualizaciones parciales via `Partial<Task>`. Esto garantiza que el cliente y el servidor utilicen los mismos nombres de campos (como `completed`).

### Contexto: Proxy de Vite

El cliente realiza una petición HTTP PATCH a una ruta relativa como `/api/tasks/:id`. En desarrollo, Vite redirige estas peticiones al servidor Express (puerto 3000), evitando configuraciones complejas de CORS.

---

### 1. Disparador (Trigger)

**`client/src/components/TaskModal.tsx`** (clase propia)

El flujo comienza en el modal de detalle cuando está en modo `'view'`. El botón principal cambia dinámicamente entre "HECHO" y "PENDIENTE" según el estado actual de la tarea. Al hacer clic, se invoca la mutación de actualización.

```tsx
const isCompleted = tasks?.find(t => t.id === selectedTaskId)?.completed;

<button 
  type="button"
  onClick={() => {
    updateTaskMutation.mutate(
      { 
        id: selectedTaskId!, 
        updates: { completed: !isCompleted } // Invierte el estado actual
      },
      { onSuccess: () => onClose() } // onClose cierra el modal vía Zustand
    );
  }}
>
  {isCompleted ? 'PENDIENTE' : 'HECHO'}
</button>
```

---

### 2. Lógica de Mutación y Caché

**`client/src/hooks/useTasks.ts`** (clase propia - React Query: dependencia externa)

Encapsula la lógica de `useMutation` para actualizar tareas. Al completarse con éxito, invalida la caché global de tareas para forzar una sincronización de todo el dashboard.

```ts
export const useUpdateTaskMutation = () => {
  const queryClient = useQueryClient(); // React Query

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Task> }) => 
      updateTask(id, updates), // Ver paso 3
    onSuccess: () => {
      // Invalida 'tasks' para que TaskFeed recupere los datos frescos
      queryClient.invalidateQueries({ queryKey: TASK_KEYS.all });
    },
  });
};
```

---

### 3. Llamada a la API (Transporte)

**`client/src/api/tasksApi.ts`** (clase propia)

Realiza el request HTTP PATCH usando `fetch` nativo. Envía únicamente los campos que han cambiado (`updates`).

```ts
export const updateTask = async (id: string, taskUpdates: Partial<Task>): Promise<Task> => {
  const response = await fetch(`${BASE_URL}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(taskUpdates),
  });

  if (!response.ok) {
    throw new Error('Failed to update task');
  }
  
  return response.json();
};
```

---

### 4. Backend: Enrutamiento

**`server/src/routes/task.routes.ts`** (clase propia - Express: dependencia externa)

El servidor recibe la petición PATCH y la delega al controlador de tareas.

```ts
import { updateTask } from '../controllers/task.controller';

// router es una instancia de express.Router()
router.patch('/:id', updateTask);
```

---

### 5. Backend: Controlador

**`server/src/controllers/task.controller.ts`** (clase propia)

Responsabilidad exclusiva: extraer `id` y el cuerpo de la request, y serializar la response.
No importa `TaskModel`. Delega al servicio.

```ts
export const updateTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const task = await TaskService.update(id, req.body); // Ver paso 6

    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    res.json(task);
  } catch (error) {
    res.status(400).json({ error: 'Error updating task' });
  }
};
```

---

### 6. Backend: Servicio

**`server/src/services/task.service.ts`** (clase propia)

Ejecuta la actualización en MongoDB y normaliza el documento resultado al tipo `Task`.
Devuelve `null` si el documento no existe, lo que permite al controller responder con 404.

```ts
export const TaskService = {
  async update(id: string, data: Partial<Task>): Promise<Task | null> {
    // findByIdAndUpdate con { new: true } devuelve el documento ya modificado.
    // .lean() lo convierte en objeto JS plano para mejor rendimiento.
    const doc = await TaskModel.findByIdAndUpdate(id, data, { new: true }).lean();
    if (!doc) return null;
    return toTaskResponse(doc); // Normaliza _id → id, elimina __v
  },
};
```

---

### 7. Backend: Persistencia

**`server/src/models/Task.ts`** (clase propia - Mongoose: dependencia externa)

El `TaskModel` interactúa con MongoDB. El esquema garantiza que `completed` sea booleano
y permite actualizaciones parciales sin afectar campos no enviados. Es consumido únicamente por `TaskService`.

```ts
export const TaskModel = mongoose.model<Task>('Task', TaskSchema);
```

---

### 8. Cierre del Ciclo (Actualización UI)

Una vez que el backend confirma el cambio (Status 200 OK):

1.  **En el Hook (`useTasks.ts`)**: React Query marca la lista de tareas como *stale*. Esto dispara un refetch automático en segundo plano para todos los componentes que consumen `useTasksQuery`.
2.  **En el Componente (`TaskModal.tsx`)**: Se ejecuta el callback `onSuccess` que invoca `onClose()`.
3.  **En el Store (`uiStore.ts`)**: La función `closeTaskModal` (llamada por `onClose`) limpia el estado global del modal, cerrándolo inmediatamente.
4.  **En el Dashboard (`TaskFeed.tsx`)**: Al recibir los nuevos datos desde el servidor, los filtros de React se recalculan. La tarea se mueve automáticamente de la sección "Hoy" (o la que corresponda) a la sección **"Completadas"**, sin necesidad de recargar la página.