import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CATEGORY_ERRORS } from '@brienne/shared';
import { createTask, updateTask } from './task.controller';
import { TaskService } from '../services/task.service';
import { DomainError } from '../services/errors';

// Simulacion de la capa de servicio para aislar el transporte HTTP
vi.mock('../services/task.service', () => ({
  TaskService: {
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

describe('taskController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('RF-10 | responde 400 con el mensaje de categoría inexistente', async () => {
    const validationError = new DomainError(CATEGORY_ERRORS.taskCategoryNotFound, 'VALIDATION');
    (TaskService.create as ReturnType<typeof vi.fn>).mockRejectedValue(validationError);
    (TaskService.update as ReturnType<typeof vi.fn>).mockRejectedValue(validationError);

    const createResImpl = createRes();
    await createTask(createReq({ title: 'Tarea', categoryId: '65a1b2c3d4e5f6a7b8c9d0e1' }), createResImpl as any);

    expect(createResImpl.statusCode).toBe(400);
    expect(createResImpl.body).toEqual({ error: CATEGORY_ERRORS.taskCategoryNotFound });

    const updateResImpl = createRes();
    await updateTask(createReq({ categoryId: '65a1b2c3d4e5f6a7b8c9d0e1' }), updateResImpl as any);

    expect(updateResImpl.statusCode).toBe(400);
    expect(updateResImpl.body).toEqual({ error: CATEGORY_ERRORS.taskCategoryNotFound });
  });
});
