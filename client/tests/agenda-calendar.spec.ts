import { test, expect } from '@playwright/test';
import { format, addDays, addMonths } from 'date-fns';
import { es } from 'date-fns/locale';

test.describe('Agenda and Calendar Synchronization (Spec 003)', () => {
  test.beforeEach(async ({ page }) => {
    // Intercepción de /api/tasks para mockear respuestas deterministas
    await page.route('*/**/api/tasks', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([])
        });
      } else {
        await route.fallback();
      }
    });

    await page.goto('/');
  });

  test('Distinción visual de Hoy y Seleccionado en MiniCalendar', async ({ page }) => {
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    const todayBtn = page.locator(`[data-testid="calendar-day-${todayStr}"]`);

    // Al inicio, hoy es la fecha seleccionada: debe tener fondo negro y borde estructural amarillo
    await expect(todayBtn).toBeVisible();
    await expect(todayBtn).toHaveClass(/bg-black/);
    await expect(todayBtn).toHaveClass(/text-white/);
    await expect(todayBtn).toHaveClass(/border-4/);
    await expect(todayBtn).toHaveClass(/border-\[#fac901\]/);

    // Seleccionamos otro dia del mismo mes (dia 1 o dia 2 si hoy es 1)
    const targetDay = today.getDate() === 1 ? 2 : 1;
    const targetDate = new Date(today.getFullYear(), today.getMonth(), targetDay);
    const targetStr = format(targetDate, 'yyyy-MM-dd');
    const targetBtn = page.locator(`[data-testid="calendar-day-${targetStr}"]`);

    await targetBtn.click();

    // El dia seleccionado adquiere fondo amarillo y texto negro
    await expect(targetBtn).toHaveClass(/bg-\[#fac901\]/);
    await expect(targetBtn).toHaveClass(/text-black/);

    // Hoy mantiene fondo negro pero pierde el borde amarillo
    await expect(todayBtn).toHaveClass(/bg-black/);
    await expect(todayBtn).toHaveClass(/text-white/);
    await expect(todayBtn).not.toHaveClass(/border-\[#fac901\]/);
  });

  test('Sincronización al hacer clic en un día del calendario y encabezado dinámico', async ({ page }) => {
    const agendaHeader = page.locator('[data-testid="agenda-header-title"]');
    await expect(agendaHeader).toHaveText('AGENDA — HOY');

    const today = new Date();
    const targetDay = today.getDate() === 1 ? 2 : 1;
    const targetDate = new Date(today.getFullYear(), today.getMonth(), targetDay);
    const targetStr = format(targetDate, 'yyyy-MM-dd');

    await page.locator(`[data-testid="calendar-day-${targetStr}"]`).click();

    // Encabezado dinamico formateado en mayusculas segun estetica neoplastica
    const expectedHeader = `AGENDA — ${format(targetDate, 'd MMM', { locale: es }).toUpperCase()}`;
    await expect(agendaHeader).toHaveText(expectedHeader);

    // La franja horaria correspondiente a las 08:00 de ese dia debe existir
    const targetSlot = page.locator(`[data-testid="slot-${targetStr}-08"]`);
    await expect(targetSlot).toBeVisible();
  });

  test('Buffer de 7 días y actualización reactiva al scrollear', async ({ page }) => {
    const agendaContainer = page.locator('[data-testid="agenda-scroll-container"]');
    // Buffer continuo de 7 dias x 24 horas = 168 franjas horarias
    const slots = agendaContainer.locator('[data-slot-date]');
    await expect(slots).toHaveCount(168);

    // Esperamos a que el scroll inicial se estabilice
    await page.waitForTimeout(250);

    // Hacemos scroll hacia una hora del dia siguiente
    const nextDay = addDays(new Date(), 1);
    const nextDayStr = format(nextDay, 'yyyy-MM-dd');
    const nextDaySlot = page.locator(`[data-testid="slot-${nextDayStr}-14"]`);

    await nextDaySlot.scrollIntoViewIfNeeded();
    // Pausa breve para permitir la ejecucion del listener de scroll determinista
    await page.waitForTimeout(250);

    // El encabezado debe actualizarse al nuevo dia focal
    const agendaHeader = page.locator('[data-testid="agenda-header-title"]');
    const expectedHeader = `AGENDA — ${format(nextDay, 'd MMM', { locale: es }).toUpperCase()}`;
    await expect(agendaHeader).toHaveText(expectedHeader);

    // El dia siguiente debe quedar marcado como seleccionado en el calendario
    const nextDayBtn = page.locator(`[data-testid="calendar-day-${nextDayStr}"]`);
    await expect(nextDayBtn).toHaveClass(/bg-\[#fac901\]/);
  });

  test('Visualización y apilamiento de múltiples tareas en la misma franja horaria', async ({ page }) => {
    const today = new Date();
    const dueTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 0, 0);

    // Inyectamos 2 tareas en la misma hora (10:00)
    await page.route('*/**/api/tasks', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 'task-spec003-1',
              title: 'Revisión Neoplástica Mondrian',
              detail: 'Detalle de revisión',
              points: 3,
              completed: false,
              dueDate: dueTime.toISOString()
            },
            {
              id: 'task-spec003-2',
              title: 'Auditoría Determinista SDD',
              detail: 'Detalle de auditoría',
              points: 5,
              completed: true,
              dueDate: dueTime.toISOString()
            }
          ])
        });
      } else {
        await route.fallback();
      }
    });

    await page.goto('/');

    const todayStr = format(today, 'yyyy-MM-dd');
    const slot10 = page.locator(`[data-testid="slot-${todayStr}-10"]`);
    await slot10.scrollIntoViewIfNeeded();

    // Verificamos apilamiento vertical: ambas tareas visibles dentro de la misma franja
    await expect(slot10.getByText('Revisión Neoplástica Mondrian')).toBeVisible();
    await expect(slot10.getByText('Auditoría Determinista SDD')).toBeVisible();

    // Tarea completada con estilo tachado
    const completedTask = slot10.getByText('Auditoría Determinista SDD');
    await expect(completedTask).toHaveClass(/line-through/);

    // Franja vacia con indicador neutro "--"
    const emptySlot = page.locator(`[data-testid="slot-${todayStr}-04"]`);
    await expect(emptySlot.getByText('--')).toBeVisible();

    // Clic en la tarea para abrir el modal de detalle/edicion
    await slot10.getByText('Revisión Neoplástica Mondrian').click();
    await expect(page.getByRole('button', { name: /EDITAR/i })).toBeVisible();
  });

  test('Navegación entre meses desde el calendario', async ({ page }) => {
    const nextMonthBtn = page.locator('button:has(.material-symbols-outlined:text("chevron_right"))');
    const initialMonth = await page.locator('h4.uppercase').first().textContent();

    await nextMonthBtn.click();
    const updatedMonth = await page.locator('h4.uppercase').first().textContent();
    expect(updatedMonth).not.toBe(initialMonth);

    // Seleccionamos un dia del mes siguiente
    const nextMonthDate = addMonths(new Date(), 1);
    const dayStr = format(new Date(nextMonthDate.getFullYear(), nextMonthDate.getMonth(), 15), 'yyyy-MM-dd');
    const dayBtn = page.locator(`[data-testid="calendar-day-${dayStr}"]`);

    await dayBtn.click();
    await expect(dayBtn).toHaveClass(/bg-\[#fac901\]/);
  });
});
