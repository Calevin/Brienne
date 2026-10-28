import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CATEGORY_ERRORS } from '@brienne/shared';
import { CategoryService } from './category.service';
import { CategoryModel } from '../models/Category';
import { TaskModel } from '../models/Task';
import { DomainError, isDuplicateKeyError } from './errors';

// Simulacion modular del modelo de categorias para aislar la persistencia
vi.mock('../models/Category', () => ({
  CategoryModel: {
    find: vi.fn(),
    findOne: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    findByIdAndDelete: vi.fn(),
  },
}));

// Simulacion del modelo de tareas para verificar la desvinculacion al eliminar
vi.mock('../models/Task', () => ({
  TaskModel: {
    updateMany: vi.fn(),
  },
}));

const VALID_ID = '507f1f77bcf86cd799439011';

// Documento fabricado con la forma que devuelve Mongoose en memoria
function buildDoc(data: Record<string, unknown>) {
  return {
    ...data,
    toObject: () => ({ _id: VALID_ID, __v: 0, ...data }),
  };
}

describe('CategoryService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('RF-01 | creación con color por defecto blanco y nombre recortado', async () => {
      (CategoryModel.findOne as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      (CategoryModel.create as ReturnType<typeof vi.fn>).mockResolvedValue(
        buildDoc({ nombre: 'Trabajo', descripcion: null, color: '#ffffff', nameKey: 'trabajo' })
      );

      const result = await CategoryService.create({ nombre: '  Trabajo  ' });

      expect(CategoryModel.create).toHaveBeenCalledWith({
        nombre: 'Trabajo',
        descripcion: null,
        color: '#ffffff',
        nameKey: 'trabajo',
      });
      expect(result.id).toBe(VALID_ID);
      expect(result.nombre).toBe('Trabajo');
      expect(result.color).toBe('#ffffff');
      expect((result as unknown as Record<string, unknown>).nameKey).toBeUndefined();
      expect((result as unknown as Record<string, unknown>)._id).toBeUndefined();
    });

    it('RF-01 | descripción vacía o de solo espacios se persiste como null', async () => {
      (CategoryModel.findOne as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      (CategoryModel.create as ReturnType<typeof vi.fn>).mockResolvedValue(
        buildDoc({ nombre: 'Notas', descripcion: null, color: '#ffffff', nameKey: 'notas' })
      );

      await CategoryService.create({ nombre: 'Notas', descripcion: '   ' });
      await CategoryService.create({ nombre: 'Notas' });

      const firstPayload = (CategoryModel.create as ReturnType<typeof vi.fn>).mock.calls[0][0];
      const secondPayload = (CategoryModel.create as ReturnType<typeof vi.fn>).mock.calls[1][0];
      expect(firstPayload.descripcion).toBeNull();
      expect(secondPayload.descripcion).toBeNull();
    });

    it('RF-05 | rechaza nombre duplicado ignorando mayúsculas y espacios extremos', async () => {
      (CategoryModel.findOne as ReturnType<typeof vi.fn>).mockResolvedValue({ nombre: 'Trabajo' });

      await expect(CategoryService.create({ nombre: '  TRABAJO  ' })).rejects.toThrow(
        CATEGORY_ERRORS.duplicateName
      );
      expect(CategoryModel.findOne).toHaveBeenCalledWith({ nameKey: 'trabajo' });
      expect(CategoryModel.create).not.toHaveBeenCalled();
    });

    it('RF-05 | mapea el error de clave duplicada de la base de datos', async () => {
      (CategoryModel.findOne as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      (CategoryModel.create as ReturnType<typeof vi.fn>).mockRejectedValue({ code: 11000 });

      const error = await CategoryService.create({ nombre: 'Trabajo' }).catch((err) => err);

      expect(error).toBeInstanceOf(DomainError);
      expect(error.code).toBe('DUPLICATE_NAME');
      expect(error.message).toBe(CATEGORY_ERRORS.duplicateName);
    });

    it('RF-05 | repropaga errores de base de datos que no son colisión de clave', async () => {
      (CategoryModel.findOne as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      const dbFailure = new Error('connection lost');
      (CategoryModel.create as ReturnType<typeof vi.fn>).mockRejectedValue(dbFailure);

      await expect(CategoryService.create({ nombre: 'Trabajo' })).rejects.toThrow('connection lost');
    });

    it('RF-05 | permite editar una categoría conservando su propio nombre', async () => {
      (CategoryModel.findOne as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      (CategoryModel.findByIdAndUpdate as ReturnType<typeof vi.fn>).mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          _id: VALID_ID,
          nombre: 'Trabajo',
          descripcion: null,
          color: '#2c4bdb',
          nameKey: 'trabajo',
        }),
      });

      const result = await CategoryService.update(VALID_ID, { nombre: 'Trabajo' });

      expect(CategoryModel.findOne).toHaveBeenCalledWith({
        nameKey: 'trabajo',
        _id: { $ne: VALID_ID },
      });
      expect(result).not.toBeNull();
      expect(result?.nombre).toBe('Trabajo');
    });
  });

  describe('validaciones', () => {
    it('RF-06 | rechaza nombre menor a 3 o mayor a 25 caracteres', async () => {
      (CategoryModel.create as ReturnType<typeof vi.fn>).mockResolvedValue(buildDoc({}));

      await expect(CategoryService.create({ nombre: 'ab' })).rejects.toThrow(CATEGORY_ERRORS.nameLength);
      await expect(CategoryService.create({ nombre: 'x'.repeat(26) })).rejects.toThrow(
        CATEGORY_ERRORS.nameLength
      );
      await expect(CategoryService.create({ nombre: null as unknown as string })).rejects.toThrow(
        CATEGORY_ERRORS.nameLength
      );
      expect(CategoryModel.create).not.toHaveBeenCalled();
    });

    it('RF-07 | acepta descripción vacía y rechaza descripción mayor a 100 caracteres', async () => {
      (CategoryModel.findOne as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      (CategoryModel.create as ReturnType<typeof vi.fn>).mockResolvedValue(
        buildDoc({ nombre: 'Notas', descripcion: null, color: '#ffffff', nameKey: 'notas' })
      );

      await expect(
        CategoryService.create({ nombre: 'Notas', descripcion: 'x'.repeat(100) })
      ).resolves.toBeDefined();
      await expect(
        CategoryService.create({ nombre: 'Notas', descripcion: 'x'.repeat(101) })
      ).rejects.toThrow(CATEGORY_ERRORS.descriptionLength);
    });

    it('RF-08 | rechaza color fuera del catálogo cerrado', async () => {
      (CategoryModel.create as ReturnType<typeof vi.fn>).mockResolvedValue(buildDoc({}));

      await expect(
        CategoryService.create({ nombre: 'Trabajo', color: '#ff0000' as '#ffffff' })
      ).rejects.toThrow(CATEGORY_ERRORS.invalidColor);
      expect(CategoryModel.create).not.toHaveBeenCalled();
    });

    it('RF-02 | revalida nombre, descripción y color en la edición', async () => {      (CategoryModel.findByIdAndUpdate as ReturnType<typeof vi.fn>).mockReturnValue({
        lean: vi.fn().mockResolvedValue({ _id: VALID_ID, nombre: 'Trabajo' }),
      });

      await expect(CategoryService.update(VALID_ID, { nombre: 'ab' })).rejects.toThrow(
        CATEGORY_ERRORS.nameLength
      );
      await expect(CategoryService.update(VALID_ID, { descripcion: 'x'.repeat(101) })).rejects.toThrow(
        CATEGORY_ERRORS.descriptionLength
      );
      await expect(
        CategoryService.update(VALID_ID, { color: '#ff0000' as '#ffffff' })
      ).rejects.toThrow(CATEGORY_ERRORS.invalidColor);
      expect(CategoryModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it('RF-02 | la edición con payload vacío devuelve el registro sin modificarlo', async () => {
      const currentDoc = {
        _id: VALID_ID,
        nombre: 'Trabajo',
        descripcion: null,
        color: '#2c4bdb',
        nameKey: 'trabajo',
      };
      (CategoryModel.findById as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        lean: vi.fn().mockResolvedValue(currentDoc),
      });

      const unchanged = await CategoryService.update(VALID_ID, {});

      expect(unchanged).toEqual({
        id: VALID_ID,
        nombre: 'Trabajo',
        descripcion: null,
        color: '#2c4bdb',
      });
      expect(CategoryModel.findByIdAndUpdate).not.toHaveBeenCalled();

      (CategoryModel.findById as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        lean: vi.fn().mockResolvedValue(null),
      });

      const missing = await CategoryService.update(VALID_ID, {});
      expect(missing).toBeNull();
    });
  });

  describe('detección de colisiones de clave', () => {
    it('RF-05 | detecta colisiones de clave con código numérico y de texto', () => {
      expect(isDuplicateKeyError({ code: 11000 })).toBe(true);
      expect(isDuplicateKeyError({ code: 'E11000' })).toBe(true);
    });

    it('RF-05 | ignora valores que no son errores de clave duplicada', () => {
      expect(isDuplicateKeyError(null)).toBe(false);
      expect(isDuplicateKeyError(undefined)).toBe(false);
      expect(isDuplicateKeyError('E11000')).toBe(false);
      expect(isDuplicateKeyError(new Error('boom'))).toBe(false);
    });
  });

  describe('findAll', () => {
    it('RF-04 | devuelve todas las categorías ordenadas alfabéticamente sin distinguir mayúsculas', async () => {
      (CategoryModel.find as ReturnType<typeof vi.fn>).mockReturnValue({
        lean: vi.fn().mockResolvedValue([
          { _id: VALID_ID, nombre: 'Zeta', descripcion: null, color: '#000000', nameKey: 'zeta' },
          { _id: 'a1', nombre: 'alfa', descripcion: null, color: '#bc0002', nameKey: 'alfa' },
          { _id: 'b1', nombre: 'Beta', descripcion: null, color: '#2c4bdb', nameKey: 'beta' },
        ]),
      });

      const result = await CategoryService.findAll();

      expect(result.map((category) => category.nombre)).toEqual(['alfa', 'Beta', 'Zeta']);
    });
  });

  describe('remove', () => {
    it('RF-03 | elimina físicamente la categoría', async () => {
      (CategoryModel.findByIdAndDelete as ReturnType<typeof vi.fn>).mockReturnValue({
        lean: vi.fn().mockResolvedValue({ _id: VALID_ID, nombre: 'Trabajo' }),
      });

      const removed = await CategoryService.remove(VALID_ID);

      expect(removed).toBe(true);
      expect(CategoryModel.findByIdAndDelete).toHaveBeenCalledWith(VALID_ID);
    });

    it('RF-03 | desvincula las tareas asociadas al eliminar la categoría', async () => {
      (CategoryModel.findByIdAndDelete as ReturnType<typeof vi.fn>).mockReturnValue({
        lean: vi.fn().mockResolvedValue({ _id: VALID_ID, nombre: 'Trabajo' }),
      });
      (TaskModel.updateMany as ReturnType<typeof vi.fn>).mockResolvedValue({ modifiedCount: 2 });

      await CategoryService.remove(VALID_ID);

      expect(TaskModel.updateMany).toHaveBeenCalledWith(
        { categoryId: VALID_ID },
        { $set: { categoryId: null } }
      );
    });

    it('RF-03 | libera el nombre para futuras creaciones después de eliminar', async () => {
      (CategoryModel.findByIdAndDelete as ReturnType<typeof vi.fn>).mockReturnValue({
        lean: vi.fn().mockResolvedValue({ _id: VALID_ID, nombre: 'Trabajo' }),
      });
      (CategoryModel.findOne as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      (CategoryModel.create as ReturnType<typeof vi.fn>).mockResolvedValue(
        buildDoc({ nombre: 'Trabajo', descripcion: null, color: '#ffffff', nameKey: 'trabajo' })
      );

      await CategoryService.remove(VALID_ID);
      const recreated = await CategoryService.create({ nombre: 'trabajo' });

      expect(recreated.id).toBe(VALID_ID);
      expect(CategoryModel.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('idempotencia', () => {
    it('RNF-01 | repetir la misma edición deja el recurso en el mismo estado', async () => {
      (CategoryModel.findOne as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      (CategoryModel.findByIdAndUpdate as ReturnType<typeof vi.fn>).mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          _id: VALID_ID,
          nombre: 'Trabajo Renombrado',
          descripcion: null,
          color: '#2c4bdb',
          nameKey: 'trabajo renombrado',
        }),
      });

      const payload = { nombre: 'Trabajo Renombrado' };
      const first = await CategoryService.update(VALID_ID, payload);
      const second = await CategoryService.update(VALID_ID, payload);

      expect(first).toEqual(second);
      const firstUpdate = (CategoryModel.findByIdAndUpdate as ReturnType<typeof vi.fn>).mock.calls[0][1];
      const secondUpdate = (CategoryModel.findByIdAndUpdate as ReturnType<typeof vi.fn>).mock.calls[1][1];
      expect(firstUpdate).toEqual(secondUpdate);
    });

    it('RNF-01 | repetir la eliminación de una categoría ya eliminada no altera el estado', async () => {
      (CategoryModel.findByIdAndDelete as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        lean: vi.fn().mockResolvedValue({ _id: VALID_ID, nombre: 'Trabajo' }),
      });
      (CategoryModel.findByIdAndDelete as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        lean: vi.fn().mockResolvedValue(null),
      });
      (TaskModel.updateMany as ReturnType<typeof vi.fn>).mockResolvedValue({ modifiedCount: 1 });

      const first = await CategoryService.remove(VALID_ID);
      const second = await CategoryService.remove(VALID_ID);

      expect(first).toBe(true);
      expect(second).toBe(false);
      expect(TaskModel.updateMany).toHaveBeenCalledTimes(1);
    });
  });

  describe('alcance del catálogo', () => {
    it('RNF-02 | el listado no depende del usuario porque el catálogo es global', async () => {
      (CategoryModel.find as ReturnType<typeof vi.fn>).mockReturnValue({
        lean: vi.fn().mockResolvedValue([
          { _id: 'a1', nombre: 'alfa', descripcion: null, color: '#bc0002', nameKey: 'alfa' },
          { _id: 'b1', nombre: 'Beta', descripcion: null, color: '#2c4bdb', nameKey: 'beta' },
        ]),
      });

      const result = await CategoryService.findAll();

      // El servicio no recibe identidad ni filtra por propietario
      expect(CategoryService.findAll.length).toBe(0);
      expect(result).toHaveLength(2);
      expect(result.map((category) => category.id)).toEqual(['a1', 'b1']);
    });
  });
});
