import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTasks, createTask, updateTask } from '../api/tasksApi';
import type { Task, CreateTaskDTO } from '@brienne/shared';

export const TASK_KEYS = {
  all: ['tasks'] as const,
};

export const useTasksQuery = () => {
  return useQuery<Task[], Error>({
    queryKey: TASK_KEYS.all,
    queryFn: getTasks,
  });
};

export const useCreateTaskMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (newTask: CreateTaskDTO) => createTask(newTask),
    onSuccess: () => {
      // Invalida la cache de tareas para el refetch automático y tener la lista actualizada.
      queryClient.invalidateQueries({ queryKey: TASK_KEYS.all });
    },
  });
};

export const useUpdateTaskMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Task> }) => updateTask(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASK_KEYS.all });
    },
  });
};
