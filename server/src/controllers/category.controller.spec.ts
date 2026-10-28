import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CATEGORY_ERRORS } from '@brienne/shared';
import { createCategory, updateCategory, deleteCategory } from './category.controller';
import { CategoryService } from '../services/category.service';
import { DomainError } from '../services/errors';

// Simulacion de la capa de servicio para aislar el transporte HTTP
vi.mock('../services/category.service', () => ({
  CategoryService: {
    findAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}));

type FakeRes = {
  statusCode: number;
  body: unknown;
  status: (code: number) => FakeRes;
  json: (payload: unknown) => FakeRes;
  send: (payload?: unknown) => FakeRes;
};

// Response falso: evita dependencias externas como supertest (prohibicion constitucional)
function createRes(): FakeRes {
  const res: FakeRes = {
    statusCode: 200,
    body: undefined,
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    json(payload: unknown) {
      res.body = payload;
      return res;
    },
    send(payload?: unknown) {
      res.body = payload;
      return res;
    },
  };
  return res;
}

function createReq(body: unknown = {}, id = '507f1f77bcf86cd799439011') {
  return { body, params: { id } } as any;
}

describe('categoryController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('RF-01 | responde 201 con la categoría creada', async () => {
    const created = { id: 'c1', nombre: 'Trabajo', descripcion: null, color: '#ffffff' };
    (CategoryService.create as ReturnType<typeof vi.fn>).mockResolvedValue(created);

    const res = createRes();
    await createCategory(createReq({ nombre: 'Trabajo' }), res as any);

    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual(created);
  });

  it('RF-02 | responde 200 con la categoría actualizada', async () => {
    const updated = { id: 'c1', nombre: 'Trabajo Nuevo', descripcion: null, color: '#2c4bdb' };
    (CategoryService.update as ReturnType<typeof vi.fn>).mockResolvedValue(updated);

    const res = createRes();
    await updateCategory(createReq({ nombre: 'Trabajo Nuevo' }), res as any);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(updated);
  });

  it('RF-05 | responde 409 Conflict con payload estructurado de duplicado', async () => {
    (CategoryService.create as ReturnType<typeof vi.fn>).mockRejectedValue(
      new DomainError(CATEGORY_ERRORS.duplicateName, 'DUPLICATE_NAME')
    );

    const res = createRes();
    await createCategory(createReq({ nombre: 'Trabajo' }), res as any);

    expect(res.statusCode).toBe(409);
    expect(res.body).toEqual({ error: CATEGORY_ERRORS.duplicateName });
  });

  it('RF-06 | responde 400 con payload estructurado de nombre', async () => {
    (CategoryService.create as ReturnType<typeof vi.fn>).mockRejectedValue(
      new DomainError(CATEGORY_ERRORS.nameLength, 'VALIDATION')
    );

    const res = createRes();
    await createCategory(createReq({ nombre: 'ab' }), res as any);

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: CATEGORY_ERRORS.nameLength });
  });

  it('RF-07 | responde 400 con payload estructurado de descripción', async () => {
    (CategoryService.create as ReturnType<typeof vi.fn>).mockRejectedValue(
      new DomainError(CATEGORY_ERRORS.descriptionLength, 'VALIDATION')
    );

    const res = createRes();
    await createCategory(createReq({ nombre: 'Trabajo' }), res as any);

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: CATEGORY_ERRORS.descriptionLength });
  });

  it('RF-08 | responde 400 con payload estructurado de color', async () => {
    (CategoryService.create as ReturnType<typeof vi.fn>).mockRejectedValue(
      new DomainError(CATEGORY_ERRORS.invalidColor, 'VALIDATION')
    );

    const res = createRes();
    await createCategory(createReq({ nombre: 'Trabajo', color: '#ff0000' }), res as any);

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: CATEGORY_ERRORS.invalidColor });
  });

  it('RF-03 | responde 204 al eliminar', async () => {
    (CategoryService.remove as ReturnType<typeof vi.fn>).mockResolvedValue(true);

    const res = createRes();
    await deleteCategory(createReq(), res as any);

    expect(res.statusCode).toBe(204);
    expect(res.body).toBeUndefined();
  });

  it('CL-07 | responde 404 al eliminar una categoría inexistente', async () => {
    (CategoryService.remove as ReturnType<typeof vi.fn>).mockResolvedValue(false);

    const res = createRes();
    await deleteCategory(createReq({}, 'inexistente-id'), res as any);

    expect(res.statusCode).toBe(404);
    expect(res.body).toMatchObject({ error: expect.any(String) });
  });

  it('RNF-01 | repetir la eliminación de una categoría inexistente responde 404 sin alterar estado', async () => {
    (CategoryService.remove as ReturnType<typeof vi.fn>).mockResolvedValue(false);

    const first = createRes();
    const second = createRes();
    await deleteCategory(createReq({}, 'inexistente-id'), first as any);
    await deleteCategory(createReq({}, 'inexistente-id'), second as any);

    expect(first.statusCode).toBe(404);
    expect(second.statusCode).toBe(404);
    expect(CategoryService.remove).toHaveBeenCalledTimes(2);
  });

  it('RNF-01 | un fallo inesperado de servicio responde 500 con payload estructurado', async () => {
    (CategoryService.create as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('boom'));

    const res = createRes();
    await createCategory(createReq({ nombre: 'Trabajo' }), res as any);

    expect(res.statusCode).toBe(500);
    expect(res.body).toMatchObject({ error: expect.any(String) });
  });
});
