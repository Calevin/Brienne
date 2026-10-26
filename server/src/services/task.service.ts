import { TaskModel } from '../models/Task';
import { Task, CreateTaskDTO, TaskSchema } from '@brienne/shared';

const DEFAULT_OWNER_ID = 'fixed-user-id-123';

// Esquema de validacion de creacion en la capa de servicio
const CreateTaskServiceSchema = TaskSchema.omit({ id: true });

// Mapea un documento Mongoose al tipo compartido Task,
// eliminando los campos internos de Mongoose (_id, __v).
function toTaskResponse(doc: any): Task {
  const { _id, __v, ...rest } = doc;
  return { id: _id ? _id.toString() : doc.id, ...rest };
}

export const TaskService = {
  async findAll(): Promise<Task[]> {
    const docs = await TaskModel.find().lean();
    return docs.map(toTaskResponse);
  },

  async create(data: CreateTaskDTO): Promise<Task> {
    const sanitizedTitle = typeof data.title === 'string' ? data.title.trim() : data.title;
    const payload = {
      ...data,
      assignedTo: data.assignedTo ?? [],
      detail: data.detail ?? null,
      recurrence: data.recurrence ?? null,
      dueDate: data.dueDate ?? null,
      completed: data.completed ?? false,
      title: sanitizedTitle,
      ownerId: data.ownerId || DEFAULT_OWNER_ID,
    };

    const validatedData = CreateTaskServiceSchema.parse(payload);
    const doc = new TaskModel(validatedData);
    await doc.save();
    return toTaskResponse(doc.toObject ? doc.toObject() : doc);
  },

  async update(id: string, data: Partial<Task>): Promise<Task | null> {
    if (data && Object.keys(data).length > 0) {
      if (data.title !== undefined) {
        data.title = typeof data.title === 'string' ? data.title.trim() : data.title;
      }
      TaskSchema.partial().parse(data);
    }
    const doc = await TaskModel.findByIdAndUpdate(id, data, { new: true }).lean();
    if (!doc) return null;
    return toTaskResponse(doc);
  },

  async remove(id: string): Promise<boolean> {
    const doc = await TaskModel.findByIdAndDelete(id).lean();
    return doc !== null;
  },
};
