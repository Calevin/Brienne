## Flujo: Eliminación de una tarea

Describe el recorrido completo desde que el usuario interactúa con la interfaz para eliminar una tarea hasta que los datos se eliminan de la base de datos y la interfaz se actualiza.

Se distingue entre dependencias externas (react-query, mongoose, express) y clases propias del proyecto.

---

### Contexto: Monorepo y tipos compartidos

El proyecto usa una estructura de monorepo donde el contrato de datos se define en el paquete `@brienne/shared`. Aunque la eliminación solo requiere el `id` (string), la consistencia en el manejo de tipos garantiza que el cliente y el servidor operen sobre el mismo modelo de datos.

### Contexto: Proxy de Vite

El cliente realiza la petición DELETE a una ruta relativa (`/api/tasks/:id`). En desarrollo, el proxy de Vite redirige esta petición al servidor Express en el puerto 3000, evitando problemas de CORS.

---

### 1. Disparador (Trigger)

**`client/src/components/TaskModal.tsx`** (clase propia)

El flujo comienza dentro del modal de detalle de tarea (en modo `'view'` o `'edit'`). Al hacer clic en el botón **"BORRAR"**, se dispara la función `handleDelete`.

```tsx
const handleDelete = () => {
  if (!selectedTaskId) return;
  setMode('delete_confirm'); // Cambia a la vista de confirmación
};
```

---

### 2. Confirmación de "Purga"

**`client/src/components/TaskModal.tsx`**

El modal cambia su estado interno a `'delete_confirm'`, mostrando una interfaz de advertencia. El usuario tiene dos opciones:
- **CANCELAR**: Vuelve al estado `'view'`.
- **CONFIRMAR BORRADO**: Ejecuta la mutación de eliminación.

```tsx
<button 
  onClick={() => {
    if (selectedTaskId) {
      deleteTaskMutation.mutate(selectedTaskId, {
        onSuccess: () => onClose() // onClose cierra el modal vía Zustand
      });
    }
  }}
>
  CONFIRMAR BORRADO
</button>
```

---

### 3. Lógica de Mutación y Caché

**`client/src/hooks/useTasks.ts`** (clase propia - React Query: dependencia externa)

Encapsula la llamada a la API y gestiona la invalidación de la caché. Al ser una eliminación, es vital informar a React Query que la lista de tareas actual ya no es válida.

```ts
export const useDeleteTaskMutation = () => {
  const queryClient = useQueryClient(); // React Query

  return useMutation({
    mutationFn: (id: string) => deleteTask(id), // Ver paso 4
    onSuccess: () => {
      // Invalida la lista completa para forzar un refetch y actualizar el dashboard
      queryClient.invalidateQueries({ queryKey: TASK_KEYS.all });
    },
  });
};
```

---

### 4. Llamada a la API (Transporte)

**`client/src/api/tasksApi.ts`** (clase propia)

Realiza el request HTTP DELETE usando `fetch` nativo.

```ts
export const deleteTask = async (id: string): Promise<void> => {
  const response = await fetch(`${BASE_URL}/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Failed to delete task');
  }
};
```

---

### 5. Backend: Enrutamiento

**`server/src/routes/task.routes.ts`** (clase propia - Express: dependencia externa)

El servidor recibe la petición y la mapea al controlador correspondiente.

```ts
import { deleteTask } from '../controllers/task.controller';

// router es una instancia de express.Router()
router.delete('/:id', deleteTask);
```

---

### 6. Backend: Controlador y Lógica

**`server/src/controllers/task.controller.ts`** (clase propia)

Extrae el `id` de los parámetros de la ruta y utiliza el modelo para ejecutar la eliminación física en la base de datos.

```ts
export const deleteTask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // findByIdAndDelete es un método de Mongoose
    const deletedTask = await TaskModel.findByIdAndDelete(id).lean();

    if (!deletedTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Status 204 No Content: éxito sin cuerpo de respuesta
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Error deleting task' });
  }
};
```

---

### 7. Backend: Persistencia

**`server/src/models/Task.ts`** (clase propia - Mongoose: dependencia externa)

El `TaskModel` interactúa con MongoDB. Aunque la operación de borrado es directa, el modelo garantiza que estamos operando sobre la colección correcta definida por el esquema.

```ts
export const TaskModel = mongoose.model<Task>('Task', TaskSchema);
```

---

### 8. Cierre del Ciclo (Actualización UI)

Una vez que el servidor responde con éxito (Status 204):

1.  **En el Hook (`useTasks.ts`)**: React Query marca la query `['tasks']` como *stale*. Esto provoca que `TaskFeed.tsx` (que está escuchando esta query) pida la lista actualizada al servidor.
2.  **En el Componente (`TaskModal.tsx`)**: Se ejecuta el callback `onSuccess` pasado al `.mutate()`, el cual llama a `onClose()`.
3.  **En el Store (`uiStore.ts`)**: La función `closeTaskModal` (llamada por `onClose`) establece `isTaskModalOpen` en `false` y limpia el `selectedTaskId`.
4.  **En la Pantalla**: El modal se cierra inmediatamente y la tarea desaparece del dashboard en cuanto el refetch de fondo completa, manteniendo la UI sincronizada con la base de datos.