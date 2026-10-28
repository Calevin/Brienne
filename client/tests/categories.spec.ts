import { test, expect } from '@playwright/test';

// Estado mutable que simula el backend de categorias (el mock es el "servidor" de cada test)
interface MockCategory {
  id: string;
  nombre: string;
  descripcion: string | null;
  color: string;
}

// Suite E2E de categorias (spec 005). Se intercepta toda la red con page.route():
// el cliente no tiene runner de unit tests y la verificacion de UI es exclusivamente E2E (Decision 4 del plan).
test.describe('Category Management', () => {
  test('Creación y validación de categorías', async ({ page }) => {
    const state: MockCategory[] = [];
    const createdBodies: Array<Record<string, unknown>> = [];
    let postAttempts = 0;
    let failWithColorError = false;

    await page.route('*/**/api/tasks', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
      } else {
        await route.fallback();
      }
    });

    await page.route('*/**/api/categories', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(state) });
        return;
      }
      if (route.request().method() === 'POST') {
        postAttempts += 1;
        const payload = route.request().postDataJSON() as Record<string, unknown>;
        // RF-08 simulado: el backend rechaza el color y la UI debe mostrar el mensaje canonico
        if (failWithColorError) {
          await route.fulfill({
            status: 400,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Color no permitido' }),
          });
          return;
        }
        // RF-05: unicidad global de nombre ignorando mayusculas (el mock replica el contrato 409)
        const normalized = String(payload.nombre).trim().toLowerCase();
        const duplicated = state.some((c) => c.nombre.trim().toLowerCase() === normalized);
        if (duplicated) {
          await route.fulfill({
            status: 409,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Nombre de categoría duplicado' }),
          });
          return;
        }
        const saved: MockCategory = {
          id: `c${state.length + 1}`,
          nombre: String(payload.nombre),
          descripcion: (payload.descripcion as string | null) ?? null,
          color: String(payload.color),
        };
        state.push(saved);
        createdBodies.push(payload);
        await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(saved) });
        return;
      }
      await route.fallback();
    });

    await page.goto('/');
    await page.getByRole('button', { name: 'Categorías' }).click();

    // Estado inicial vacio
    await expect(page.getByText('No hay categorías todavía')).toBeVisible();

    // RF-01: paleta cerrada de cinco colores y color por defecto blanco
    await page.getByRole('button', { name: 'Nueva categoría' }).click();
    const palette = page.getByTestId('category-color-picker');
    await expect(palette.getByRole('button')).toHaveCount(5);
    await expect(palette.getByRole('button', { name: 'Blanco' })).toHaveAttribute('aria-pressed', 'true');

    // RF-06: nombre menor a 3 caracteres impide el guardado en cliente (sin despachar POST)
    await page.getByLabel('Nombre de categoría').fill('ab');
    await page.getByRole('button', { name: /Guardar/i }).click();
    await expect(page.getByText('El nombre debe tener entre 3 y 25 caracteres')).toBeVisible();
    expect(postAttempts).toBe(0);

    // RF-07: descripcion mayor a 100 caracteres impide el guardado en cliente
    await page.getByLabel('Nombre de categoría').fill('Trabajo');
    await page.getByLabel('Descripción de la categoría').fill('x'.repeat(101));
    await page.getByRole('button', { name: /Guardar/i }).click();
    await expect(page.getByText('La descripción no puede superar los 100 caracteres')).toBeVisible();
    expect(postAttempts).toBe(0);

    // RF-01: creacion valida con descripcion vacia (se despacha como null) y color Azul
    await page.getByLabel('Descripción de la categoría').fill('');
    await palette.getByRole('button', { name: 'Azul' }).click();
    await expect(palette.getByRole('button', { name: 'Azul' })).toHaveAttribute('aria-pressed', 'true');
    await expect(palette.getByRole('button', { name: 'Blanco' })).toHaveAttribute('aria-pressed', 'false');
    await page.getByRole('button', { name: /Guardar/i }).click();

    expect(postAttempts).toBe(1);
    expect(createdBodies).toHaveLength(1);
    expect(createdBodies[0]).toEqual({ nombre: 'Trabajo', descripcion: null, color: '#2c4bdb' });
    await expect(page.getByText('Trabajo')).toBeVisible();
    await expect(page.getByText('1 categoría')).toBeVisible();

    // RF-05: nombre duplicado ignorando mayusculas -> 409 con el mensaje del backend
    await page.getByRole('button', { name: 'Nueva categoría' }).click();
    await page.getByLabel('Nombre de categoría').fill('trabajo');
    await page.getByRole('button', { name: /Guardar/i }).click();
    await expect(page.getByText('Nombre de categoría duplicado')).toBeVisible();
    // Prevenir guardado: el formulario sigue abierto y solo existe una categoria
    await expect(page.getByLabel('Nombre de categoría')).toBeVisible();
    expect(postAttempts).toBe(2);
    expect(createdBodies).toHaveLength(1);

    // RF-08: el backend rechaza el color y la UI propaga el mensaje canonico
    failWithColorError = true;
    await page.getByLabel('Nombre de categoría').fill('SoloParaColor');
    await page.getByRole('button', { name: /Guardar/i }).click();
    await expect(page.getByText('Color no permitido')).toBeVisible();
    expect(postAttempts).toBe(3);
    expect(createdBodies).toHaveLength(1);
  });

  test('Edición de categorías con estado local', async ({ page }) => {
    const state: MockCategory[] = [
      { id: 'c1', nombre: 'Trabajo', descripcion: 'Original', color: '#2c4bdb' },
    ];
    const patchBodies: Array<Record<string, unknown>> = [];

    await page.route('*/**/api/tasks', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
      } else {
        await route.fallback();
      }
    });

    await page.route('*/**/api/categories', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(state) });
        return;
      }
      await route.fallback();
    });

    await page.route('*/**/api/categories/c1', async (route) => {
      if (route.request().method() === 'PATCH') {
        const payload = route.request().postDataJSON() as Record<string, unknown>;
        patchBodies.push(payload);
        // RF-02: revalidacion completa de nombre, descripcion y color
        state[0] = {
          ...state[0],
          nombre: String(payload.nombre),
          descripcion: (payload.descripcion as string | null) ?? null,
          color: String(payload.color),
        };
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(state[0]) });
        return;
      }
      await route.fallback();
    });

    await page.goto('/');
    await page.getByRole('button', { name: 'Categorías' }).click();

    // RF-09: los cambios viven en estado local mientras el modal esta abierto (sin PATCH)
    await page.getByRole('button', { name: 'Editar Trabajo' }).click();
    const nameInput = page.getByLabel('Nombre de categoría');
    await nameInput.fill('Trabajo EDITADO');
    await page.getByLabel('Descripción de la categoría').fill('Editada localmente');
    // El borrador sobrevive a los re-renders del formulario y no se despacha nada todavia
    await expect(nameInput).toHaveValue('Trabajo EDITADO');
    expect(patchBodies).toHaveLength(0);

    // CL-04: cancelar descarta el borrador local y vuelve al listado original
    await page.getByRole('button', { name: /Cancelar/i }).click();
    await expect(page.getByText('Trabajo')).toBeVisible();
    await expect(page.getByText('Trabajo EDITADO')).not.toBeVisible();
    expect(patchBodies).toHaveLength(0);

    // RF-02: el guardado despacha la revalidacion completa y refresca el listado
    await page.getByRole('button', { name: 'Editar Trabajo' }).click();
    await page.getByLabel('Nombre de categoría').fill('Trabajo EDITADO');
    await page.getByLabel('Descripción de la categoría').fill('Editada localmente');
    await page.getByRole('button', { name: /Guardar/i }).click();
    expect(patchBodies).toHaveLength(1);
    expect(patchBodies[0]).toEqual({
      nombre: 'Trabajo EDITADO',
      descripcion: 'Editada localmente',
      color: '#2c4bdb',
    });
    await expect(page.getByText('Trabajo EDITADO')).toBeVisible();

    // RF-09: cerrar el modal sin guardar descarta el borrador (el componente se desmonta)
    await page.getByRole('button', { name: 'Editar Trabajo EDITADO' }).click();
    await page.getByLabel('Nombre de categoría').fill('DescartadoAlCerrar');
    await page.getByRole('button', { name: 'Cerrar modal de categorías' }).click();
    await page.getByRole('button', { name: 'Categorías' }).click();
    await expect(page.getByText('DescartadoAlCerrar')).not.toBeVisible();
    // Reabrir la edicion muestra el valor persistido, no el borrador descartado
    await page.getByRole('button', { name: 'Editar Trabajo EDITADO' }).click();
    await expect(page.getByLabel('Nombre de categoría')).toHaveValue('Trabajo EDITADO');
    expect(patchBodies).toHaveLength(1);
  });

  test('Eliminación de categorías con confirmación', async ({ page }) => {
    const state: MockCategory[] = [
      { id: 'c1', nombre: 'Trabajo', descripcion: null, color: '#bc0002' },
      { id: 'c2', nombre: 'Hogar', descripcion: null, color: '#2c4bdb' },
    ];
    const deletedIds: string[] = [];
    const taskMethods: string[] = [];

    // CL-06: la tarea asociada al catalogo sigue viva; la eliminacion jamas la borra
    await page.route('*/**/api/tasks', async (route) => {
      taskMethods.push(route.request().method());
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { id: 't1', title: 'Tarea Asociada', detail: null, points: 3, completed: false, dueDate: null },
          ]),
        });
        return;
      }
      await route.fallback();
    });

    await page.route('*/**/api/categories', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(state) });
        return;
      }
      await route.fallback();
    });

    await page.route('*/**/api/categories/c1', async (route) => {
      if (route.request().method() === 'DELETE') {
        deletedIds.push('c1');
        state.splice(0, 1);
        await route.fulfill({ status: 204, body: '' });
        return;
      }
      await route.fallback();
    });

    await page.goto('/');
    await page.getByRole('button', { name: 'Categorías' }).click();
    await expect(page.getByRole('listitem')).toHaveCount(2);

    // CL-04/RNF: la confirmacion explicita evita la eliminacion accidental
    await page.getByRole('button', { name: 'Eliminar Trabajo' }).click();
    await expect(page.getByText('¿Eliminar la categoría?')).toBeVisible();
    await expect(page.getByText('Las tareas asociadas quedarán sin categoría. La eliminación es definitiva.')).toBeVisible();
    await page.getByRole('button', { name: 'CANCELAR' }).click();
    await expect(page.getByRole('listitem')).toHaveCount(2);
    expect(deletedIds).toHaveLength(0);

    // RF-03: confirmar el borrado despacha el DELETE y refresca el listado
    await page.getByRole('button', { name: 'Eliminar Trabajo' }).click();
    await page.getByRole('button', { name: 'CONFIRMAR BORRADO' }).click();
    expect(deletedIds).toEqual(['c1']);
    await expect(page.getByRole('listitem')).toHaveCount(1);
    await expect(page.getByText('Hogar')).toBeVisible();
    await expect(page.getByText('Trabajo')).not.toBeVisible();

    // CL-06: la tarea sobrevive y jamas se envio un DELETE hacia /api/tasks
    await expect(page.getByText('Tarea Asociada')).toBeVisible();
    expect(taskMethods.every((m) => m !== 'DELETE')).toBe(true);
  });

  test('Selección de categoría en la creación de tareas', async ({ page }) => {
    // El backend devuelve el catalogo ya ordenado alfabeticamente (RF-04); la UI debe respetar ese orden
    const categories: MockCategory[] = [
      { id: 'c1', nombre: 'alfa', descripcion: null, color: '#bc0002' },
      { id: 'c2', nombre: 'Beta', descripcion: null, color: '#2c4bdb' },
      { id: 'c3', nombre: 'zeta', descripcion: null, color: '#000000' },
    ];
    const taskPosts: Array<Record<string, unknown>> = [];

    await page.route('*/**/api/categories', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(categories) });
        return;
      }
      await route.fallback();
    });

    await page.route('*/**/api/tasks', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
        return;
      }
      if (route.request().method() === 'POST') {
        const payload = route.request().postDataJSON() as Record<string, unknown>;
        taskPosts.push(payload);
        // RF-10: la categoria fue borrada por otro usuario entre el render y el guardado
        if (payload.categoryId === 'c3') {
          await route.fulfill({
            status: 400,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Categoría inexistente' }),
          });
          return;
        }
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ ...payload, id: `t${taskPosts.length}`, completed: false }),
        });
        return;
      }
      await route.fallback();
    });

    await page.goto('/');
    // Clic en boton de "Nueva Tarea" (icono add_box en Sidebar)
    await page.getByText('add_box').click();

    // RF-04: el selector respeta el orden recibido del backend y arranca en "sin categoria"
    const picker = page.getByTestId('category-picker');
    await expect(picker.getByRole('button')).toHaveText(['SIN CATEGORÍA', 'alfa', 'Beta', 'zeta']);
    await expect(picker.getByRole('button', { name: 'SIN CATEGORÍA' })).toHaveAttribute('aria-pressed', 'true');

    // RF-10/CL-10: seleccionar una categoria incluye categoryId en el payload de la tarea
    await picker.getByRole('button', { name: 'Beta' }).click();
    await expect(picker.getByRole('button', { name: 'Beta' })).toHaveAttribute('aria-pressed', 'true');
    await expect(picker.getByRole('button', { name: 'SIN CATEGORÍA' })).toHaveAttribute('aria-pressed', 'false');
    await page.getByPlaceholder(/EJ: VIGILANCIA DE LOS PUERTOS/i).fill('Tarea con categoría');
    await page.getByRole('button', { name: /Guardar/i }).click();
    expect(taskPosts).toHaveLength(1);
    expect(taskPosts[0]).toMatchObject({ title: 'Tarea con categoría', categoryId: 'c2' });

    // CL-10: crear sin tocar el selector despacha categoryId null
    await page.getByText('add_box').click();
    await expect(page.getByTestId('category-picker').getByRole('button', { name: 'SIN CATEGORÍA' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    await page.getByPlaceholder(/EJ: VIGILANCIA DE LOS PUERTOS/i).fill('Tarea sin categoría');
    await page.getByRole('button', { name: /Guardar/i }).click();
    expect(taskPosts).toHaveLength(2);
    expect(taskPosts[1]).toMatchObject({ title: 'Tarea sin categoría', categoryId: null });

    // RF-10: el backend rechaza la categoria borrada y la UI muestra el mensaje canonico sin cerrar el modal
    await page.getByText('add_box').click();
    await page.getByTestId('category-picker').getByRole('button', { name: 'zeta' }).click();
    await page.getByPlaceholder(/EJ: VIGILANCIA DE LOS PUERTOS/i).fill('Tarea con categoria borrada');
    await page.getByRole('button', { name: /Guardar/i }).click();
    await expect(page.getByText('Categoría inexistente')).toBeVisible();
    await expect(page.getByPlaceholder(/EJ: VIGILANCIA DE LOS PUERTOS/i)).toBeVisible();
    expect(taskPosts).toHaveLength(3);
  });
});
