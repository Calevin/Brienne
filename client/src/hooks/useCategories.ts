import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Category, CreateCategoryDTO, UpdateCategoryDTO } from '@brienne/shared';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../api/categoriesApi';

export const CATEGORY_KEYS = {
  all: ['categories'] as const,
};

export const useCategoriesQuery = () => {
  return useQuery<Category[], Error>({
    queryKey: CATEGORY_KEYS.all,
    queryFn: getCategories,
  });
};

export const useCreateCategoryMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateCategoryDTO) => createCategory(payload),
    onSuccess: () => {
      // Invalida la cache de categorias para refrescar listados y selectores
      queryClient.invalidateQueries({ queryKey: CATEGORY_KEYS.all });
    },
  });
};

export const useUpdateCategoryMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateCategoryDTO }) =>
      updateCategory(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORY_KEYS.all });
    },
  });
};

export const useDeleteCategoryMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORY_KEYS.all });
    },
  });
};
