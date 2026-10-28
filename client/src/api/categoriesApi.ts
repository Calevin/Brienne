import type { Category, CreateCategoryDTO, UpdateCategoryDTO } from '@brienne/shared';

// No necesitamos la URL completa gracias al proxy de vite configurado en vite.config.ts
const BASE_URL = '/api/categories';

// Extrae el payload de error canonico { error } para que la UI muestre el mensaje real del backend
async function readError(response: Response): Promise<Error> {
  const body = await response.json().catch(() => null);
  const message =
    body && typeof body === 'object' && typeof (body as { error?: unknown }).error === 'string'
      ? (body as { error: string }).error
      : 'Error en la operación de categorías';
  return new Error(message);
}

export const getCategories = async (): Promise<Category[]> => {
  const response = await fetch(BASE_URL);
  if (!response.ok) {
    throw await readError(response);
  }
  return response.json();
};

export const createCategory = async (payload: CreateCategoryDTO): Promise<Category> => {
  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw await readError(response);
  }
  return response.json();
};

export const updateCategory = async (id: string, payload: UpdateCategoryDTO): Promise<Category> => {
  const response = await fetch(`${BASE_URL}/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw await readError(response);
  }
  return response.json();
};

export const deleteCategory = async (id: string): Promise<void> => {
  const response = await fetch(`${BASE_URL}/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw await readError(response);
  }
};
