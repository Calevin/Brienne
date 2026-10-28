# Verificador Programático — categorias (Spec 005)

> **Contrato Inmutable (`seb-harness`):** Este archivo es ejecutado automáticamente por `.seb/bin/seb verify categorias` y por el hook `pre-commit` de Git.
> **Prohibición Anti-Reward-Hacking:** El agente implementador tiene terminantemente prohibido editar este archivo o relajar los tests invocados.

## 1. Matriz de Controles Ejecutables (Parseada por `seb verify`)

| Check ID | Requisito | Descripción de la Verificación | Comando Determinista |
| :--- | :--- | :--- | :--- |
| CHK-01 | RF-01 | Creación con color por defecto blanco, recorte del nombre y descripción vacía a `null` | `direnv exec . pnpm --filter server exec vitest run src/services/category.service.spec.ts -t "RF-01"` |
| CHK-02 | RF-05,CL-01,CL-05,CL-08 | Unicidad global de nombre (ignorando mayúsculas y espacios), autoexclusión en edición, mapeo de clave duplicada e índice único declarado en el modelo | `direnv exec . pnpm --filter server exec vitest run src/services/category.service.spec.ts -t "RF-05" && direnv exec . pnpm --filter server exec vitest run src/models/Category.spec.ts` |
| CHK-03 | RF-06,RF-07,RF-08,CL-02,CL-03 | Validaciones de longitud de nombre (3-25), descripción (<=100, sin mínimo) y color con los mensajes exactos de la spec | `direnv exec . pnpm --filter server exec vitest run src/services/category.service.spec.ts -t "RF-0[678]"` |
| CHK-04 | RF-02 | Revalidación de nombre, descripción y color durante la edición | `direnv exec . pnpm --filter server exec vitest run src/services/category.service.spec.ts -t "RF-02"` |
| CHK-05 | RF-04 | Listado global de categorías ordenado alfabéticamente de forma ascendente sin distinguir mayúsculas | `direnv exec . pnpm --filter server exec vitest run src/services/category.service.spec.ts -t "RF-04"` |
| CHK-06 | RF-03,CL-06,CL-09 | Eliminación física, desvinculación de tareas asociadas sin borrarlas y liberación del nombre | `direnv exec . pnpm --filter server exec vitest run src/services/category.service.spec.ts -t "RF-03"` |
| CHK-07 | RF-10,CL-10 | Relación tarea-categoría opcional y rechazo de categoría inexistente en servicio y en API | `direnv exec . pnpm --filter server exec vitest run src/services/task.service.spec.ts -t "RF-10" && direnv exec . pnpm --filter server exec vitest run src/controllers/task.controller.spec.ts -t "RF-10"` |
| CHK-08 | RF-03,RF-05,RF-06,RF-07,RF-08,CL-07,RNF-01 | Códigos HTTP (201/200/204/400/404/409), payload estructurado `{ error }`, idempotencia de edición y eliminación | `direnv exec . pnpm --filter server exec vitest run src/services/category.service.spec.ts -t "RNF-01" && direnv exec . pnpm --filter server exec vitest run src/controllers/category.controller.spec.ts` |
| CHK-09 | RNF-02 | Rutas de categorías montadas tras `requireAuth` y catálogo global sin filtro por usuario | `direnv exec . pnpm --filter server exec vitest run src/routes/category.routes.spec.ts && direnv exec . pnpm --filter server exec vitest run src/services/category.service.spec.ts -t "RNF-02"` |
| CHK-10 | RF-01,RF-05,RF-06,RF-07,RF-08 | E2E de creación con la paleta de 5 colores, prevención del guardado y visibilidad de los mensajes de error | `direnv exec . npx playwright test -c client/playwright.config.ts -g "Creación y validación de categorías"` |
| CHK-11 | RF-02,RF-09,CL-04 | E2E de edición con cambios locales mientras el modal está abierto y descarte al cerrarlo | `direnv exec . npx playwright test -c client/playwright.config.ts -g "Edición de categorías con estado local"` |
| CHK-12 | RF-03,CL-06 | E2E de eliminación con confirmación explícita y refresco del listado | `direnv exec . npx playwright test -c client/playwright.config.ts -g "Eliminación de categorías con confirmación"` |
| CHK-13 | RF-04,RF-10,CL-10 | E2E del selector de categoría en el modal de tareas, respeto del orden recibido y rechazo de categoría inexistente | `direnv exec . npx playwright test -c client/playwright.config.ts -g "Selección de categoría en la creación de tareas"` |
| CHK-98 | RNF-01,RNF-02 | Análisis estático del cliente y compilación estricta de todos los paquetes | `direnv exec . pnpm --filter client lint && direnv exec . pnpm -r build` |
| CHK-99 | GLOBAL | Build global, suite de backend completa con umbral de cobertura y suite E2E completa sin regresiones | `direnv exec . pnpm -r build && direnv exec . pnpm --filter server test && direnv exec . npx playwright test -c client/playwright.config.ts` |

## 2. Criterio de Aprobación

- La tarea solo se considera implementada cuando `.seb/bin/seb verify categorias` reporta **100% de los controles (`CHK-01` a `CHK-99`) en estado `[PASA]`**.
