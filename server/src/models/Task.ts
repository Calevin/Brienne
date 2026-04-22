import mongoose, { Schema } from 'mongoose';
import { Task } from '@brienne/shared';

// TypeScript infiere cosas aca. Para mapear Mongoose con Zod limpiamente,
// le decimos a Mongoose que esto sigue la interfaz `Task` de nuestro paquete compartido.
const TaskSchema = new Schema<Task>({
  title: { type: String, required: true },
  points: { type: Number, required: true, enum: [0, 1, 2, 3, 5, 8, 13, 21] },
  assignedTo: { type: [String], default: [] },
  ownerId: { type: String, required: true },
  detail: { type: String, default: null }, // Detalle breve opcional sobre la tarea
  recurrence: { type: String, default: null }, // Mongoose permite nulls para estos si no es required
  dueDate: { type: Date, default: null },
  completed: { type: Boolean, default: false }
}, {
  timestamps: true // Añade createdAt y updatedAt automáticamente
});

export const TaskModel = mongoose.model<Task>('Task', TaskSchema);
