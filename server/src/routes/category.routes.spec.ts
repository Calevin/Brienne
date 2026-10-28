import { describe, it, expect } from 'vitest';
import { requireAuth } from '../middlewares/auth';
import categoryRoutes from './category.routes';

describe('categoryRoutes', () => {
  it('RNF-02 | las rutas de categorías montan el middleware de identidad autenticada', () => {
    const stack = (categoryRoutes as unknown as { stack: Array<{ handle: unknown }> }).stack;

    expect(stack.some((layer) => layer.handle === requireAuth)).toBe(true);
    expect(stack.length).toBeGreaterThan(0);
  });
});
