## Flujo: Creación de una nueva tarea

Describe el recorrido completo desde que el usuario interactúa con la interfaz para crear una tarea hasta que los datos se persisten en la base de datos y la interfaz se actualiza.

Se distingue entre dependencias externas (react-query, mongoose, zustand) y clases propias del proyecto.

---

### 1. Disparador (Trigger)

**`client/src/components/Sidebar.tsx`** (clase propia)

El flujo comienza en el sidebar. El botón "Agregar tarea" (icono `add_box`) invoca la función `openTaskModal` del store de UI.

```tsx
const openTaskModal = useUIStore((state) => state.openTaskModal);

// ...
<button onClick={() => openTaskModal()}>
  <span className="material-symbols-outlined">add_box</span>
</button>
```

---

### 2. Gestión de Estado Global

**`client/src/store/uiStore.ts`** (clase propia - Zustand: dependencia externa)

Zustand centraliza la visibilidad del modal. Al llamar a `openTaskModal()` sin argumentos, `selectedTaskId` queda como `null`, lo que indica al modal que debe entrar en modo **creación**.

```ts
openTaskModal: (taskId?: string) => set({ 
  isTaskModalOpen: true, 
  selectedTaskId: taskId || null 
}),
```

---

### 3. Visualización y Reset del Formulario

**`client/src/components/TaskModal.tsx`** (clase propia)

El componente `App.tsx` renderiza el `TaskModal` basándose en el estado de `uiStore`. Al abrirse y detectar que no hay un `selectedTaskId`, el `useEffect` limpia el estado interno (título, puntos, fecha, etc.) y establece el modo en `'create'`.

```ts
useEffect(() => {
  if (isOpen && !selectedTaskId) {
    setTitle('');
    setPoints(1);
    setMode('create');
    // ... reset de otros campos
  }
}, [isOpen, selectedTaskId]);
```

---

### 4. Envío del Formulario (Mutation)

**`client/src/components/TaskModal.tsx`**

Al hacer submit, se recolectan los datos del estado local y se invoca la mutación. Se usa `createTaskMutation.mutate` (dependencia propia que envuelve react-query).

```ts
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  if (mode === 'create') {
    createTaskMutation.mutate(
      { title, points, ownerId: 'fixed-user-id-123', ... },
      { onSuccess: () => onClose() } // onClose cierra el modal vía Zustand
    );
  }
};
```

**Nota sobre `onSuccess`**: 
- El `onSuccess` definido en el componente (arriba) se encarga de **cerrar el modal**.
- El `onSuccess` definido en el hook (paso 5) se encarga de **invalidar la caché**.

---

### 5. Lógica de Mutación y Caché

**`client/src/hooks/useTasks.ts`** (clase propia - React Query: dependencia externa)

Encapsula la llamada a la API y gestiona la invalidación de la caché de tareas.

```ts
export const useCreateTaskMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (newTask: CreateTaskDTO) => createTask(newTask), // Ver paso 6
    onSuccess: () => {
      // Invalida 'tasks' para disparar un refetch automático en el dashboard
      queryClient.invalidateQueries({ queryKey: TASK_KEYS.all });
    },
  });
};
```

`CreateTaskDTO` es un tipo importado de `@brienne/shared`, garantizando consistencia en el contrato de datos.

---

### 6. Llamada a la API (Transporte)

**`client/src/api/tasksApi.ts`** (clase propia)

Realiza el request HTTP POST. Usa el proxy de Vite para redirigir `/api/tasks` al servidor backend.

```ts
export const createTask = async (task: CreateTaskDTO): Promise<Task> => {
  const response = await fetch('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task),
  });
  
  if (!response.ok) throw new Error('Failed to create task');
  return response.json();
};
```

---

### 7. Backend: Enrutamiento

**`server/src/routes/task.routes.ts`** (clase propia - Express: dependencia externa)

El servidor recibe la petición POST y la delega al controlador correspondiente.

```ts
import { createTask } from '../controllers/task.controller';
// ...
router.post('/', createTask);
```

---

### 8. Backend: Controlador

**`server/src/controllers/task.controller.ts`** (clase propia)

Responsabilidad exclusiva: parsear la request HTTP y serializar la response.
No importa `TaskModel`. Delega la lógica de negocio al servicio.

```ts
export const createTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const taskData: CreateTaskDTO = req.body;
    const task = await TaskService.create(taskData); // Ver paso 9
    res.status(201).json(task);
  } catch (error) {
    res.status(400).json({ error: 'Error creating task' });
  }
};
```

---

### 9. Backend: Servicio

**`server/src/services/task.service.ts`** (clase propia)

Encapsula la lógica de negocio (asignación de `ownerId` por defecto) y el acceso a datos.
También convierte el documento Mongoose al tipo `Task` de `@brienne/shared`.

```ts
export const TaskService = {
  async create(data: CreateTaskDTO): Promise<Task> {
    if (!data.ownerId) {
      data.ownerId = 'fixed-user-id-123'; // ownerId temporal hasta implementar auth
    }
    const doc = new TaskModel(data);
    await doc.save();
    return toTaskResponse(doc.toObject()); // Normaliza _id → id
  },
};
```

---

### 10. Backend: Persistencia

**`server/src/models/Task.ts`** (clase propia - Mongoose: dependencia externa)

El `TaskModel` interactúa con MongoDB. Es consumido únicamente por `TaskService`.

```ts
const TaskSchema = new Schema<Task>({
  title: { type: String, required: true },
  points: { type: Number, required: true },
  // ... resto de campos
});

export const TaskModel = mongoose.model<Task>('Task', TaskSchema);
```

---

### 11. Cierre del Ciclo (Actualización UI)

Una vez que el servidor responde con éxito (Status 201):

1. **En el Hook (`useTasks.ts`)**: React Query marca la query `['tasks']` como *stale* (vieja). Esto provoca que `TaskFeed.tsx` (que usa `useTasksQuery`) vuelva a pedir las tareas al servidor automáticamente.
2. **En el Componente (`TaskModal.tsx`)**: Se ejecuta el `onSuccess` del `.mutate()`, llamando a `onClose()`.
3. **En el Store (`uiStore.ts`)**: `closeTaskModal` cambia `isTaskModalOpen` a `false`.
4. **En la Pantalla**: El modal desaparece y la nueva tarea aparece en el listado del dashboard casi instantáneamente gracias al refetch de fondo.