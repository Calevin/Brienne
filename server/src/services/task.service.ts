import { TaskModel } from '../models/Task';
import { Task, CreateTaskDTO } from '@brienne/shared';

const DEFAULT_OWNER_ID = 'fixed-user-id-123';

// Mapea un documento Mongoose al tipo compartido Task,
// eliminando los campos internos de Mongoose (_id, __v).
function toTaskResponse(doc: any): Task {
  const { _id, __v, ...rest } = doc;
  return { id: _id.toString(), ...rest };
}

export const TaskService = {
  async findAll(): Promise<Task[]> {
    const docs = await TaskModel.find().lean();
    return docs.map(toTaskResponse);
  },

  async create(data: CreateTaskDTO): Promise<Task> {
    if (!data.ownerId) {
      data.ownerId = DEFAULT_OWNER_ID;
    }
    const doc = new TaskModel(data);
    await doc.save();
    return toTaskResponse(doc.toObject());
  },

  async update(id: string, data: Partial<Task>): Promise<Task | null> {
    const doc = await TaskModel.findByIdAndUpdate(id, data, { new: true }).lean();
    if (!doc) return null;
    return toTaskResponse(doc);
  },

  async remove(id: string): Promise<boolean> {
    const doc = await TaskModel.findByIdAndDelete(id).lean();
    return doc !== null;
  },
};
