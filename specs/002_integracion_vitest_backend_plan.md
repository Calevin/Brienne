# Plan Técnico — integracion_vitest_backend (Spec 002)

- **Spec Origen:** `specs/002_integracion_vitest_backend_spec.md`
- **Verificador Asociado:** `specs/002_integracion_vitest_backend_verificador.md`
- **Estado:** `PLANIFICADO`

## 1. Resumen Arquitectónico y Aislamiento de Lógica

El workspace `server` carece de un harness de pruebas unitarias (`DEBT-01` en `MEMORY.md`), bloqueando la validación determinista de los servicios del backend. La arquitectura actual desacopla el transporte HTTP (`TaskController`) de la lógica de negocio (`TaskService`), permitiendo aislar completamente el modelo Mongoose (`TaskModel`) mediante dobles de prueba (`vi.mock`).

**Diseño de la Solución:**
1. **Infraestructura de Pruebas con Vitest:**
   - Incorporar `vitest` y `@vitest/coverage-v8` en `server/devDependencies`.
   - Crear `server/vitest.config.ts` configurado en entorno Node, con inclusión de archivos `src/**/*.spec.ts` y umbrales estrictos de cobertura mínima del 75% (`statements`, `branches`, `functions`, `lines`) sobre `src/services/**`.
   - Definir en `server/package.json` el script canónico `"test": "vitest run --coverage"`.

2. **Aislamiento Determinista y Mocking de Persistencia:**
   - En `server/src/services/task.service.spec.ts`, simular las operaciones del modelo Mongoose (`find`, `findByIdAndUpdate`, `findByIdAndDelete` y el constructor de `TaskModel` con su método `save`) mediante `vi.mock('../models/Task')`.
   - Esto garantiza que las pruebas no dependan de demonios de bases de datos externos (`brienne_mongo`), no abran sockets de red y ejecuten en menos de 2 segundos.

3. **Garantía de Invariantes Constitucionales en Capa de Servicio:**
   - `TaskService.create` validará los datos de entrada contra el esquema canónico de `@brienne/shared` (`TaskSchema.omit({ id: true })`) antes de invocar la persistencia.
   - De este modo, entradas con títulos vacíos o estimaciones fuera de la secuencia Fibonacci (`0, 1, 2, 3, 5, 8, 13, 21`) serán rechazadas de inmediato mediante excepciones de validación, garantizando las invariantes `RF-07` y `RF-08`.
   - Se inyectará el `ownerId` por defecto (`fixed-user-id-123`) cuando no sea provisto (`RF-04`), y se asegurará que `completed` sea `false` por omisión.

4. **Transformación Canónica y Manejo de Recursos Inexistentes:**
   - Se verificará la eliminación de campos internos de Mongoose (`_id`, `__v`) y la preservación del `id` canónico (`RF-05`).
   - Se verificará el retorno controlado de `null` en `update` y `false` en `remove` cuando la consulta no halle coincidencias (`RF-06`).

## 2. Mapa de Archivos a Crear o Modificar

| Archivo / Ruta | Acción (`CREAR` / `MODIFICAR`) | Responsabilidad Técnica | Requisitos Cubiertos (`RF-XX`) |
| :--- | :--- | :--- | :--- |
| `server/package.json` | `MODIFICAR` | Agregar dependencias de desarrollo (`vitest`, `@vitest/coverage-v8`) y scripts de test (`test`, `test:watch`) | `RF-01`, `RNF-03`, `RNF-04` |
| `server/vitest.config.ts` | `CREAR` | Configuración no interactiva de Vitest con umbrales de cobertura del 75% sobre `src/services/**` | `RF-01`, `RF-02`, `RF-03`, `RNF-04` |
| `server/src/services/task.service.ts` | `MODIFICAR` | Aplicar validación de invariantes con esquema Zod de `@brienne/shared` antes de persistir | `RF-04`, `RF-07`, `RF-08` |
| `server/src/services/task.service.spec.ts` | `CREAR` | Suite de pruebas unitarias sobre `TaskService` con mocks de Mongoose cubriendo invariantes y ciclo CRUD | `RF-01` a `RF-08`, `RNF-01`, `RNF-02` |

## 3. Contratos, Firmas y Modelo de Datos

Integración con los contratos de `@brienne/shared`:
```typescript
import { Task, CreateTaskDTO, TaskSchema } from '@brienne/shared';

// Esquema de validación para creación de tareas en servicio
const CreateTaskServiceSchema = TaskSchema.omit({ id: true });
```

Firma de configuración en `server/vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.spec.ts', 'src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html'],
      include: ['src/services/**'],
      thresholds: {
        statements: 75,
        branches: 75,
        functions: 75,
        lines: 75,
      },
    },
  },
});
```

Estructura de la suite unitaria en `server/src/services/task.service.spec.ts`:
```typescript
describe('TaskService', () => {
  describe('findAll', () => {
    it('debe retornar lista de tareas con mapeo canónico excluyendo _id y __v', async () => { ... });
  });

  describe('create', () => {
    it('debe asignar ownerId por defecto cuando no se provee', async () => { ... });
    it('debe respetar el ownerId provisto', async () => { ... });
    it('debe respetar las invariantes de dominio (completed=false, Fibonacci)', async () => { ... });
    it('debe rechazar la creación si el título está vacío', async () => { ... });
    it('debe rechazar la creación si los puntos no pertenecen a Fibonacci', async () => { ... });
  });

  describe('update', () => {
    it('debe retornar la tarea actualizada con mapeo canónico', async () => { ... });
    it('debe retornar null ante un recurso inexistente', async () => { ... });
  });

  describe('remove', () => {
    it('debe retornar true si el recurso fue eliminado', async () => { ... });
    it('debe retornar false ante un recurso inexistente', async () => { ... });
  });
});
```

## 4. Decisiones Técnicas Justificadas

- **Decisión 1: Adopción de Vitest con provider v8 y threshold del 75% en configuración.**
  - *Alternativa descartada:* `jest` o `node:test`. Descartadas por decisión histórica `[D-01]` y Sección B de `docs/constitution.md`. Vitest comparte sintaxis, tooling y máxima velocidad en TypeScript sin pasos de build intermedios.
- **Decisión 2: Mocking modular de Mongoose (`vi.mock('../models/Task')`) en lugar de `mongodb-memory-server`.**
  - *Alternativa descartada:* Levantar un binario de MongoDB en memoria. Descartada por violar RNF-01 (descarga y arranque pesado que excede los 10 segundos) y por violar el principio constitucional de desacoplamiento de la capa de servicios.
- **Decisión 3: Validación con `TaskSchema` en `TaskService.create`.**
  - *Alternativa descartada:* Confiar únicamente en la validación del controlador Express. Descartada porque el servicio debe ser autónomo y garantizar sus invariantes (`RF-07`, `RF-08`) independientemente del mecanismo de transporte o invocación.

## 5. Secuencia de Tareas Atómicas (TDD: Test en Rojo -> Código -> Test en Verde)

_Regla para el Agente Implementador: Ejecuta UNA tarea a la vez en orden de dependencia. Primero escribe el test y verifica que falle (Rojo), luego escribe el código mínimo hasta pasar (Verde)._

- [ ] **T1. Incorporación de Vitest y scripts en el workspace del servidor** (`RF-01`, `RNF-03`, `RNF-04`)
  - _Archivos:_ `server/package.json`, `server/vitest.config.ts`
  - _Hecho cuando:_ Se instalan `vitest` y `@vitest/coverage-v8`, y `server/package.json` expone los scripts `test` y `build` funcionales.
- [ ] **T2. Pruebas unitarias de mapeo canónico y consulta de tareas** (`RF-01`, `RF-05`)
  - _Archivos:_ `server/src/services/task.service.spec.ts`
  - _Hecho cuando:_ El comando `direnv exec . pnpm --filter server exec vitest run -t "mapeo canónico"` retorna código de salida `0` (`CHK-03` en verde).
- [ ] **T3. Pruebas unitarias de asignación de ownerId por defecto** (`RF-04`)
  - _Archivos:_ `server/src/services/task.service.spec.ts`
  - _Hecho cuando:_ El comando `direnv exec . pnpm --filter server exec vitest run -t "ownerId por defecto"` retorna código de salida `0` (`CHK-02` en verde).
- [ ] **T4. Refactorización de validación e invariantes constitucionales en TaskService** (`RF-07`, `RF-08`)
  - _Archivos:_ `server/src/services/task.service.ts`, `server/src/services/task.service.spec.ts`
  - _Hecho cuando:_ El comando `direnv exec . pnpm --filter server exec vitest run -t "invariantes de dominio"` retorna código de salida `0` (`CHK-05` en verde).
- [ ] **T5. Pruebas unitarias de manejo controlado de recursos inexistentes** (`RF-06`)
  - _Archivos:_ `server/src/services/task.service.spec.ts`
  - _Hecho cuando:_ El comando `direnv exec . pnpm --filter server exec vitest run -t "recurso inexistente"` retorna código de salida `0` (`CHK-04` en verde).
- [ ] **T6. Verificación integral de suite, umbral de cobertura del 75% y build** (`RF-01` a `RF-08`, `RNF-01` a `RNF-04`)
  - _Archivos:_ `server/package.json`, `server/src/services/task.service.spec.ts`
  - _Hecho cuando:_ El comando `.seb/bin/seb verify integracion_vitest_backend` reporta el 100% de los controles (`CHK-01` a `CHK-99`) en estado `[PASA]`.
