import { z } from "zod";

// Validamos que el número sea de la secuencia Fibonacci (simplificado para los típicos de Story Points)
const fibonacciPoints = z.union([
  z.literal(0),
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(5),
  z.literal(8),
  z.literal(13),
  z.literal(21)
]);

export const TaskSchema = z.object({
  id: z.string().optional(), // El ID puede ser provisto por la DB
  title: z.string().min(1, "El título no puede estar vacío"),
  points: fibonacciPoints,
  assignedTo: z.array(z.string()), // Array de IDs de usuarios
  ownerId: z.string(),
  detail: z.string().nullable().optional(), // Detalle breve opcional sobre la tarea
  recurrence: z.string().nullable(), // Null si no es recurrente
  dueDate: z.coerce.date().nullable(), // Zod transformará strings ISO a objetos Date si se envía desde JSON
  completed: z.boolean().default(false),
});

export type Task = z.infer<typeof TaskSchema>;
// Tipo de Entrada para Crear la Tarea (sin cosas generadas por BD)
export type CreateTaskDTO = Omit<Task, 'id'>;
