import { Request, Response } from 'express';
import { CreateCategoryDTO, UpdateCategoryDTO } from '@brienne/shared';
import { CategoryService } from '../services/category.service';
import { DomainError, DomainErrorCode } from '../services/errors';

// Unico punto del backend que traduce codigos de dominio a codigos HTTP (constitution E)
const DOMAIN_HTTP_STATUS: Record<DomainErrorCode, number> = {
  VALIDATION: 400,
  DUPLICATE_NAME: 409,
  NOT_FOUND: 404,
};

// Toda respuesta de error conserva el payload estructurado { error } exigido por la constitucion
function respondError(res: Response, error: unknown, fallbackMessage: string): void {
  if (error instanceof DomainError) {
    res.status(DOMAIN_HTTP_STATUS[error.code]).json({ error: error.message });
    return;
  }
  console.error(fallbackMessage, error);
  res.status(500).json({ error: fallbackMessage });
}

export const getCategories = async (_req: Request, res: Response): Promise<void> => {
  try {
    const categories = await CategoryService.findAll();
    res.json(categories);
  } catch (error) {
    respondError(res, error, 'Error fetching categories');
  }
};

export const createCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const category = await CategoryService.create(req.body as CreateCategoryDTO);
    res.status(201).json(category);
  } catch (error) {
    respondError(res, error, 'Error creating category');
  }
};

export const updateCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const category = await CategoryService.update(req.params.id, req.body as UpdateCategoryDTO);
    if (!category) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }
    res.json(category);
  } catch (error) {
    respondError(res, error, 'Error updating category');
  }
};

export const deleteCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const removed = await CategoryService.remove(req.params.id);
    if (!removed) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }
    res.status(204).send();
  } catch (error) {
    respondError(res, error, 'Error deleting category');
  }
};
