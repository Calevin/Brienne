import type { Task, CreateTaskDTO } from '@brienne/shared';

// No necesitamos la URL completa gracias al proxy the vite que hemos configurado en vite.config.ts.
const BASE_URL = '/api/tasks';

export const getTasks = async (): Promise<Task[]> => {
  const response = await fetch(BASE_URL);
  if (!response.ok) {
    throw new Error('Failed to fetch tasks');
  }
  return response.json();
};

export const createTask = async (task: CreateTaskDTO): Promise<Task> => {
  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(task),
  });

  if (!response.ok) {
    throw new Error('Failed to create task');
  }
  
  return response.json();
};

export const updateTask = async (id: string, taskUpdates: Partial<Task>): Promise<Task> => {
  const response = await fetch(`${BASE_URL}/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(taskUpdates),
  });

  if (!response.ok) {
    throw new Error('Failed to update task');
  }
  
  return response.json();
};
