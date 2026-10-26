# Verificador Programático — sincronizacion_calendario_agenda (Spec 003)

> **Contrato Inmutable (`seb-harness`):** Este archivo es ejecutado automáticamente por `.seb/bin/seb verify sincronizacion_calendario_agenda` y por el hook `pre-commit` de Git.
> **Prohibición Anti-Reward-Hacking:** El agente implementador tiene terminantemente prohibido editar este archivo o relajar los tests invocados.

## 1. Matriz de Controles Ejecutables (Parseada por `seb verify`)

| Check ID | Requisito | Descripción de la Verificación | Comando Determinista |
| :--- | :--- | :--- | :--- |
| CHK-01 | RF-01,RF-02 | Verificación visual neoplástica de día actual, día seleccionado y su coincidencia | `direnv exec . npx playwright test -c client/playwright.config.ts -g "Distinción visual de Hoy y Seleccionado"` |
| CHK-02 | RF-03,RF-06 | Verificación de selección de día en calendario, auto-scroll y título dinámico | `direnv exec . npx playwright test -c client/playwright.config.ts -g "Sincronización al hacer clic en un día del calendario y encabezado dinámico"` |
| CHK-03 | RF-04,RF-05 | Verificación de buffer de 7 días y actualización reactiva al cruzar medianoche por scroll | `direnv exec . npx playwright test -c client/playwright.config.ts -g "Buffer de 7 días y actualización reactiva al scrollear"` |
| CHK-04 | RF-07,RF-08,RF-09 | Verificación de apilamiento vertical de tareas, apertura de modal e indicador neutro | `direnv exec . npx playwright test -c client/playwright.config.ts -g "Visualización y apilamiento de múltiples tareas"` |
| CHK-05 | RF-10 | Verificación de actualización del mes del calendario al seleccionar días adyacentes | `direnv exec . npx playwright test -c client/playwright.config.ts -g "Navegación entre meses desde el calendario"` |
| CHK-98 | RNF-02,RNF-03 | Análisis estático y verificación de tipos del cliente sin errores ni advertencias | `direnv exec . pnpm --filter client lint` |
| CHK-99 | GLOBAL | Compilación limpia de todos los paquetes y suite completa de pruebas sin regresiones | `direnv exec . pnpm -r build && direnv exec . npx playwright test -c client/playwright.config.ts` |

## 2. Criterio de Aprobación

- La tarea solo se considera implementada cuando `.seb/bin/seb verify sincronizacion_calendario_agenda` reporta **100% de los controles (`CHK-01` a `CHK-99`) en estado `[PASA]`**.
