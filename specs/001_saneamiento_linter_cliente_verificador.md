# Verificador Programático — saneamiento_linter_cliente (Spec 001)

> **Contrato Inmutable (`seb-harness`):** Este archivo es ejecutado automáticamente por `.seb/bin/seb verify saneamiento_linter_cliente` y por el hook `pre-commit` de Git.
> **Prohibición Anti-Reward-Hacking:** El agente implementador tiene terminantemente prohibido editar este archivo o relajar los tests invocados.

## 1. Matriz de Controles Ejecutables (Parseada por `seb verify`)

| Check ID | Requisito | Descripción de la Verificación | Comando Determinista |
| :--- | :--- | :--- | :--- |
| CHK-01 | RF-01 | Auditoría estática estricta del cliente sin errores ni advertencias | `direnv exec . pnpm --filter client lint` |
| CHK-02 | RF-02 | Verificación E2E de inicialización en modo creación de tarea | `direnv exec . npx playwright test -c client/playwright.config.ts -g "Nueva tarea"` |
| CHK-03 | RF-03 | Verificación E2E de precarga en modo edición de tarea existente | `direnv exec . npx playwright test -c client/playwright.config.ts -g "Edición de tarea"` |
| CHK-04 | RF-04,RF-05 | Verificación E2E del ciclo de vida y validación del modal de tareas | `direnv exec . npx playwright test -c client/playwright.config.ts -g "Task Management"` |
| CHK-98 | RF-01 | Compilación estricta y empaquetado del módulo cliente | `direnv exec . pnpm --filter client build` |
| CHK-99 | RF-01,RF-02,RF-03,RF-04,RF-05 | Verificación integral de cliente sin regresiones (linter, build y E2E) | `direnv exec . pnpm --filter client lint && direnv exec . pnpm --filter client build && direnv exec . npx playwright test -c client/playwright.config.ts` |

## 2. Criterio de Aprobación

- La tarea solo se considera implementada cuando `.seb/bin/seb verify saneamiento_linter_cliente` reporta **100% de los controles (`CHK-01` a `CHK-99`) en estado `[PASA]`**.
