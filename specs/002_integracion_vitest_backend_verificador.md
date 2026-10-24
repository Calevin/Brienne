# Verificador Programático — integracion_vitest_backend (Spec 002)

> **Contrato Inmutable (`seb-harness`):** Este archivo es ejecutado automáticamente por `.seb/bin/seb verify integracion_vitest_backend` y por el hook `pre-commit` de Git.
> **Prohibición Anti-Reward-Hacking:** El agente implementador tiene terminantemente prohibido editar este archivo o relajar los tests invocados.

## 1. Matriz de Controles Ejecutables (Parseada por `seb verify`)

| Check ID | Requisito | Descripción de la Verificación | Comando Determinista |
| :--- | :--- | :--- | :--- |
| CHK-01 | RF-01,RF-02,RF-03 | Suite completa de pruebas con verificación del umbral del 75% de cobertura | `direnv exec . pnpm --filter server test` |
| CHK-02 | RF-04 | Verificación unitaria de asignación de ownerId por defecto en creación | `direnv exec . pnpm --filter server exec vitest run -t "ownerId por defecto"` |
| CHK-03 | RF-05 | Verificación unitaria de mapeo canónico de tarea y exclusión de metadatos de persistencia | `direnv exec . pnpm --filter server exec vitest run -t "mapeo canónico"` |
| CHK-04 | RF-06 | Verificación unitaria de manejo controlado de recursos inexistentes | `direnv exec . pnpm --filter server exec vitest run -t "recurso inexistente"` |
| CHK-05 | RF-07,RF-08 | Verificación unitaria de invariantes constitucionales (Fibonacci, título y completitud) | `direnv exec . pnpm --filter server exec vitest run -t "invariantes de dominio"` |
| CHK-98 | RNF-01,RNF-02,RNF-03 | Compilación estricta y verificación de tipos del módulo del servidor | `direnv exec . pnpm --filter server build` |
| CHK-99 | GLOBAL | Verificación integral de backend (compilación estricta y suite completa de tests con cobertura) | `direnv exec . pnpm --filter server build && direnv exec . pnpm --filter server test` |

## 2. Criterio de Aprobación

- La tarea solo se considera implementada cuando `.seb/bin/seb verify integracion_vitest_backend` reporta **100% de los controles (`CHK-01` a `CHK-99`) en estado `[PASA]`**.
