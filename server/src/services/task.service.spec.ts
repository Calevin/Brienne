import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CATEGORY_ERRORS } from '@brienne/shared';
import { TaskService } from './task.service';
import { TaskModel } from '../models/Task';
import { CategoryModel } from '../models/Category';

// Simulacion modular del modelo Mongoose para aislar la persistencia
vi.mock('../models/Task', () => {
  const MockTaskModelInstance = function (this: any, data: any) {
    Object.assign(this, data);
    this.save = vi.fn().mockResolvedValue(this);
    this.toObject = vi.fn().mockReturnValue({
      _id: '507f1f77bcf86cd799439011',
      __v: 0,
      ...data,
    });
  };

  (MockTaskModelInstance as any).find = vi.fn();
  (MockTaskModelInstance as any).findByIdAndUpdate = vi.fn();
  (MockTaskModelInstance as any).findByIdAndDelete = vi.fn();

  return {
    TaskModel: MockTaskModelInstance,
  };
});

// Simulacion del modelo de categorias para validar la existencia de la referencia (RF-10)
vi.mock('../models/Category', () => ({
  CategoryModel: {
    exists: vi.fn(),
  },
}));

describe('TaskService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('findAll', () => {
    it('debe realizar mapeo canónico excluyendo _id y __v en la consulta', async () => {
      const rawMongoDocs = [
        {
          _id: '507f1f77bcf86cd799439011',
          __v: 0,
          title: 'Tarea 1',
          points: 3,
          ownerId: 'user-1',
          assignedTo: [],
          detail: null,
          recurrence: null,
          dueDate: null,
          completed: false,
        },
      ];

      (TaskModel.find as any).mockReturnValue({
        lean: vi.fn().mockResolvedValue(rawMongoDocs),
      });

      const result = await TaskService.findAll();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('507f1f77bcf86cd799439011');
      expect((result[0] as any)._id).toBeUndefined();
      expect((result[0] as any).__v).toBeUndefined();
      expect(result[0].title).toBe('Tarea 1');
    });
  });

  describe('create', () => {
    it('debe verificar la asignación de ownerId por defecto cuando no es provisto', async () => {
      const taskInput = {
        title: 'Nueva tarea sin owner',
        points: 5 as const,
      };

      const result = await TaskService.create(taskInput as any);

      expect(result.ownerId).toBe('fixed-user-id-123');
      expect(result.id).toBe('507f1f77bcf86cd799439011');
      expect((result as any)._id).toBeUndefined();
      expect((result as any).__v).toBeUndefined();
    });

    it('debe respetar el ownerId provisto explícitamente', async () => {
      const taskInput = {
        title: 'Tarea con owner explicito',
        points: 8 as const,
        ownerId: 'custom-user-456',
      };

      const result = await TaskService.create(taskInput as any);

      expect(result.ownerId).toBe('custom-user-456');
    });

    it('debe verificar invariantes de dominio: estado inicial completed en false y Fibonacci', async () => {
      const taskInput = {
        title: 'Tarea con puntos Fibonacci válidos',
        points: 13 as const,
      };

      const result = await TaskService.create(taskInput as any);

      expect(result.completed).toBe(false);
      expect(result.points).toBe(13);
    });

    it('debe rechazar invariantes de dominio si la estimación no pertenece a Fibonacci', async () => {
      const invalidTaskInput = {
        title: 'Tarea con puntos inválidos',
        points: 4 as any,
      };

      await expect(TaskService.create(invalidTaskInput as any)).rejects.toThrow();
    });

    it('debe rechazar invariantes de dominio si el título está vacío o contiene sólo espacios', async () => {
      const emptyTitleInput = {
        title: '   ',
        points: 2 as const,
      };

      await expect(TaskService.create(emptyTitleInput as any)).rejects.toThrow();
    });
  });

  describe('update', () => {
    it('debe actualizar una tarea existente y aplicar mapeo canónico', async () => {
      const updatedMongoDoc = {
        _id: '507f1f77bcf86cd799439011',
        __v: 0,
        title: 'Tarea Actualizada',
        points: 8,
        ownerId: 'user-1',
        assignedTo: [],
        detail: null,
        recurrence: null,
        dueDate: null,
        completed: true,
      };

      (TaskModel.findByIdAndUpdate as any).mockReturnValue({
        lean: vi.fn().mockResolvedValue(updatedMongoDoc),
      });

      const result = await TaskService.update('507f1f77bcf86cd799439011', {
        title: 'Tarea Actualizada',
        points: 8,
        completed: true,
      });

      expect(result).not.toBeNull();
      expect(result?.id).toBe('507f1f77bcf86cd799439011');
      expect((result as any)?._id).toBeUndefined();
      expect(result?.title).toBe('Tarea Actualizada');
      expect(result?.completed).toBe(true);
    });

    it('debe manejar recurso inexistente en actualización retornando null sin excepción', async () => {
      (TaskModel.findByIdAndUpdate as any).mockReturnValue({
        lean: vi.fn().mockResolvedValue(null),
      });

      const result = await TaskService.update('inexistente-id', { title: 'No existe' });

      expect(result).toBeNull();
    });

    it('debe validar invariantes de dominio al actualizar campos', async () => {
      await expect(
        TaskService.update('id-1', { points: 99 as any })
      ).rejects.toThrow();
    });
  });

  describe('relación con categorías', () => {
    it('RF-10 | rechaza crear una tarea con categoría inexistente', async () => {
      (CategoryModel.exists as any).mockResolvedValue(null);

      const invalidInput = {
        title: 'Tarea con categoría borrada',
        points: 3 as const,
        categoryId: '65a1b2c3d4e5f6a7b8c9d0e1',
      };

      await expect(TaskService.create(invalidInput as any)).rejects.toThrow(
        CATEGORY_ERRORS.taskCategoryNotFound
      );
      expect(CategoryModel.exists).toHaveBeenCalledWith({ _id: invalidInput.categoryId });
    });

    it('RF-10 | rechaza editar una tarea con categoría inexistente', async () => {
      (CategoryModel.exists as any).mockResolvedValue(null);

      await expect(
        TaskService.update('507f1f77bcf86cd799439011', { categoryId: '65a1b2c3d4e5f6a7b8c9d0e1' } as any)
      ).rejects.toThrow(CATEGORY_ERRORS.taskCategoryNotFound);
      expect(TaskModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it('RF-10 | un identificador de categoría con formato inválido se trata como inexistente', async () => {
      (CategoryModel.exists as any).mockRejectedValue(new Error('Cast to ObjectId failed'));

      await expect(
        TaskService.create({
          title: 'Tarea con id invalido',
          points: 3 as const,
          categoryId: 'not-an-object-id',
        } as any)
      ).rejects.toThrow(CATEGORY_ERRORS.taskCategoryNotFound);
    });

    it('RF-10 | permite crear y editar tareas sin categoría asociada', async () => {
      const created = await TaskService.create({
        title: 'Tarea sin categoría',
        points: 5 as const,
      } as any);

      expect(created.categoryId).toBeNull();
      expect(CategoryModel.exists).not.toHaveBeenCalled();

      (TaskModel.findByIdAndUpdate as any).mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          _id: '507f1f77bcf86cd799439011',
          __v: 0,
          title: 'Tarea sin categoría',
          points: 5,
          ownerId: 'user-1',
          assignedTo: [],
          detail: null,
          recurrence: null,
          dueDate: null,
          completed: false,
          categoryId: null,
        }),
      });

      const updated = await TaskService.update('507f1f77bcf86cd799439011', { categoryId: null } as any);

      expect(updated).not.toBeNull();
      expect(updated?.categoryId).toBeNull();
      expect(CategoryModel.exists).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('debe retornar true si el recurso fue eliminado exitosamente', async () => {
      (TaskModel.findByIdAndDelete as any).mockReturnValue({
        lean: vi.fn().mockResolvedValue({ _id: '507f1f77bcf86cd799439011' }),
      });

      const result = await TaskService.remove('507f1f77bcf86cd799439011');

      expect(result).toBe(true);
    });

    it('debe manejar recurso inexistente en eliminación retornando false sin excepción', async () => {
      (TaskModel.findByIdAndDelete as any).mockReturnValue({
        lean: vi.fn().mockResolvedValue(null),
      });

      const result = await TaskService.remove('inexistente-id');

      expect(result).toBe(false);
    });
  });
});
