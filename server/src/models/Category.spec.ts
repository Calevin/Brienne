import { describe, it, expect } from 'vitest';
import { CategoryModel } from './Category';

describe('CategoryModel', () => {
  it('RF-05 | declara índice único sobre el nombre normalizado', () => {
    const indexes = CategoryModel.schema.indexes() as Array<[Record<string, number>, Record<string, unknown>]>;

    const hasUniqueNameKey = indexes.some(
      ([fields, options]) => fields.nameKey === 1 && options.unique === true
    );

    expect(hasUniqueNameKey).toBe(true);
  });
});
