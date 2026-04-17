import { Request, Response } from 'express';
import { TaskModel } from '../models/Task';
import { CreateTaskDTO } from '@brienne/shared';

// Función para mapear documento Mongoose al tipo compartido Task
function mapToTaskResponse(doc: any) {
  const { _id, __v, ...rest } = doc;
  return {
    id: _id.toString(),
    ...rest
  };
}

export const getTasks = async (req: Request, res: Response) => {
  try {
    const tasks = await TaskModel.find().lean();
    res.json(tasks.map(mapToTaskResponse));
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Error fetching tasks' });
  }
};

export const createTask = async (req: Request, res: Response) => {
  try {
    const taskData: CreateTaskDTO = req.body;
    
    // Fuerza el owner_id temporal.
    if (!taskData.ownerId) {
      taskData.ownerId = 'fixed-user-id-123';
    }

    const newTask = new TaskModel(taskData);
    await newTask.save();
    
    res.status(201).json(mapToTaskResponse(newTask.toObject()));
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(400).json({ error: 'Error creating task' });
  }
};

export const updateTask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const taskData = req.body;
    
    const updatedTask = await TaskModel.findByIdAndUpdate(
      id,
      taskData,
      { new: true } // Devuelve el doc nuevo modificado
    ).lean();

    if (!updatedTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(mapToTaskResponse(updatedTask));
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(400).json({ error: 'Error updating task' });
  }
};
