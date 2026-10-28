# Plan Técnico — categorias (Spec 005)

- **Spec Origen:** `specs/005_categorias_spec.md`
- **Verificador Asociado:** `specs/005_categorias_verificador.md`
- **Estado:** `PLANIFICADO`

## 1. Resumen Arquitectónico y Aislamiento de Lógica

Se implementa un catálogo global de categorías con CRUD completo, siguiendo la separación de capas de `docs/constitution.md`:

1. **Contrato único en `@brienne/shared`:** Nace `shared/src/category.schema.ts` como fuente canónica de la entidad (esquema Zod, catálogo cerrado de 5 colores y mensajes exactos de error). `shared/src/task.schema.ts` se extiende con `categoryId: string | null`, manteniendo la regla de contrato único (Sección C).

2. **Lógica de dominio pura en `server/src/services/` (`CategoryService`):** Normalización (trim de extremos, clave de unicidad en minúsculas), validaciones con Zod, unicidad global, orden alfabético y desvinculación de tareas al eliminar. Los errores de negocio se expresan con `DomainError` (código de dominio `VALIDATION | DUPLICATE_NAME | NOT_FOUND`), **sin** referencias a Express ni a HTTP (Sección C, aislamiento de lógica).

3. **Transporte HTTP fino en `server/src/controllers/category.controller.ts`:** Único lugar donde `DomainError` se traduce a códigos (`VALIDATION → 400`, `DUPLICATE_NAME → 409`, `NOT_FOUND → 404`) con payload `{ "error": string }` (Sección E).

4. **Integridad en persistencia:** El modelo Mongoose `Category` declara un índice único sobre `nameKey` (nombre recortado en minúsculas), de modo que la unicidad global exigida por RF-05/CL-08 se garantiza en la base de datos ante escrituras concurrentes, y no solo con una verificación previa en aplicación.

5. **Frontend:** Estado del servidor vía TanStack Query (`useCategories`), estado de UI de apertura en Zustand (`uiStore`), y **borradores de edición en estado local del componente** (`CategoryModal`) para cumplir RF-09. Los drafts viven en `useState` y se descartan al desmontar el modal. El selector de categoría del `TaskModal` reemplaza los botones hardcodeados actuales.

Sin nuevas dependencias: tests del servidor con `vitest` (ya instalado), E2E del cliente con `Playwright` (ya instalado), validación compartida con `zod` (ya instalado). El cliente no tiene runner de unit tests propio, por lo que toda verificación de UI se hace vía E2E.

## 2. Mapa de Archivos a Crear o Modificar

| Archivo / Ruta                                       | Acción (`CREAR` / `MODIFICAR`) | Responsabilidad Técnica                                                                                     | Requisitos Cubiertos (`RF-XX`)                           |
| :--------------------------------------------------- | :----------------------------- | :---------------------------------------------------------------------------------------------------------- | :------------------------------------------------------- |
| `shared/src/category.schema.ts`                      | `CREAR`                        | Esquema Zod, `CATEGORY_COLORS` (5 hex), `CATEGORY_ERRORS` (mensajes exactos), DTOs de creación/edición      | `RF-01`, `RF-02`, `RF-05`, `RF-06`, `RF-07`, `RF-08`     |
| `shared/src/index.ts`                                | `MODIFICAR`                    | Re-exportar `category.schema`                                                                               | `RF-01` a `RF-08`                                        |
| `shared/src/task.schema.ts`                          | `MODIFICAR`                    | Agregar `categoryId: z.string().nullable().default(null)`                                                   | `RF-10`                                                  |
| `server/src/models/Category.ts`                      | `CREAR`                        | Modelo Mongoose con índice único sobre `nameKey` y enum de color                                            | `RF-05`, `CL-08`                                         |
| `server/src/models/Category.spec.ts`                 | `CREAR`                        | Test determinista del índice único y campos del modelo                                                      | `RF-05`, `CL-08`                                         |
| `server/src/models/Task.ts`                          | `MODIFICAR`                    | Campo `categoryId` (String, default `null`)                                                                 | `RF-03`, `RF-10`                                         |
| `server/src/services/errors.ts`                      | `CREAR`                        | `DomainError` y `DomainErrorCode` (agnóstico de HTTP)                                                       | `RNF-01`                                                 |
| `server/src/services/category.service.ts`            | `CREAR`                        | Normalización, validación, CRUD, unicidad y desvinculación de tareas                                        | `RF-01` a `RF-05`, `RNF-01`, `RNF-02`                    |
| `server/src/services/category.service.spec.ts`       | `CREAR`                        | Tests unitarios de dominio (mocks modulares de modelos)                                                     | `RF-01` a `RF-05`, `CL-01` a `CL-09`, `RNF-01`, `RNF-02` |
| `server/src/services/task.service.ts`                | `MODIFICAR`                    | Validar `categoryId` existente antes de crear/editar tarea                                                  | `RF-10`                                                  |
| `server/src/services/task.service.spec.ts`           | `MODIFICAR`                    | Tests de categoría inexistente y de tarea sin categoría                                                     | `RF-10`, `CL-10`                                         |
| `server/src/controllers/category.controller.ts`      | `CREAR`                        | Mapeo `DomainError → 400/404/409`, respuestas `201/200/204`                                                 | `RF-03`, `RF-05` a `RF-08`, `RNF-01`, `CL-07`            |
| `server/src/controllers/category.controller.spec.ts` | `CREAR`                        | Tests de códigos HTTP y payloads con `req/res` falsos                                                       | `RF-05` a `RF-08`, `RNF-01`, `CL-07`                     |
| `server/src/controllers/task.controller.ts`          | `MODIFICAR`                    | Traducir `DomainError` a `400` con su mensaje exacto                                                        | `RF-10`                                                  |
| `server/src/controllers/task.controller.spec.ts`     | `CREAR`                        | Test del `400` con mensaje "Categoría inexistente"                                                          | `RF-10`                                                  |
| `server/src/routes/category.routes.ts`               | `CREAR`                        | Router CRUD montado tras `requireAuth`                                                                      | `RNF-02`                                                 |
| `server/src/routes/category.routes.spec.ts`          | `CREAR`                        | Test de presencia de `requireAuth` en el stack del router                                                   | `RNF-02`                                                 |
| `server/src/index.ts`                                | `MODIFICAR`                    | Montar `app.use('/api/categories', categoryRoutes)`                                                         | `RNF-02`                                                 |
| `client/src/api/categoriesApi.ts`                    | `CREAR`                        | Cliente fetch tipado que propaga `payload.error` como mensaje                                               | `RF-05` a `RF-08`                                        |
| `client/src/hooks/useCategories.ts`                  | `CREAR`                        | Hooks TanStack Query con invalidación de caché                                                              | `RF-04`                                                  |
| `client/src/components/CategoryModal.tsx`            | `CREAR`                        | Modal CRUD Mondrian: lista, crear, editar, confirmar borrado, paleta de 5 colores y borradores locales      | `RF-01` a `RF-09`, `CL-01` a `CL-05`                     |
| `client/src/store/uiStore.ts`                        | `MODIFICAR`                    | `isCategoryModalOpen`, `openCategoryModal`, `closeCategoryModal`                                            | `RF-09`                                                  |
| `client/src/components/Sidebar.tsx`                  | `MODIFICAR`                    | Botón `aria-label="Categorías"` (icono `category`)                                                          | `RF-01`                                                  |
| `client/src/App.tsx`                                 | `MODIFICAR`                    | Renderizar `CategoryModal`                                                                                  | `RF-01`                                                  |
| `client/src/components/TaskModal.tsx`                | `MODIFICAR`                    | Selector dinámico de categoría (chips con color + "SIN CATEGORÍA") y muestra del mensaje de error de la API | `RF-04`, `RF-10`, `CL-10`                                |
| `client/tests/categories.spec.ts`                    | `CREAR`                        | Suite E2E con `page.route()` para los flujos de categoría                                                   | `RF-01` a `RF-10`, `RNF-02`                              |

## 3. Contratos, Firmas y Modelo de Datos

### 3.1 Contratos compartidos (`shared/src/category.schema.ts`)

```typescript
// Catalogo cerrado de colores de la paleta neoplastica (hex minusculas)
export const CATEGORY_COLORS = [
  "#bc0002",
  "#2c4bdb",
  "#fac901",
  "#000000",
  "#ffffff",
] as const;
export const DEFAULT_CATEGORY_COLOR = "#ffffff";
export const CATEGORY_COLOR_OPTIONS: ReadonlyArray<{
  value: (typeof CATEGORY_COLORS)[number];
  label: string;
}> = [
  { value: "#bc0002", label: "Rojo" },
  { value: "#2c4bdb", label: "Azul" },
  { value: "#fac901", label: "Amarillo" },
  { value: "#000000", label: "Negro" },
  { value: "#ffffff", label: "Blanco" },
];

// Mensajes exactos exigidos por la spec: deben coincidir en cliente y servidor
export const CATEGORY_ERRORS = {
  duplicateName: "Nombre de categoría duplicado",
  nameLength: "El nombre debe tener entre 3 y 25 caracteres",
  descriptionLength: "La descripción no puede superar los 100 caracteres",
  invalidColor: "Color no permitido",
  taskCategoryNotFound: "Categoría inexistente",
} as const;

// Zod: trim() se ejecuta ANTES de min/max, por eso los limites aplican sobre el valor recortado
export const CategorySchema = z.object({
  id: z.string().optional(),
  nombre: z
    .string()
    .trim()
    .min(3, CATEGORY_ERRORS.nameLength)
    .max(25, CATEGORY_ERRORS.nameLength),
  descripcion: z
    .string()
    .trim()
    .max(100, CATEGORY_ERRORS.descriptionLength)
    .nullable(),
  color: z.enum(CATEGORY_COLORS, {
    errorMap: () => ({ message: CATEGORY_ERRORS.invalidColor }),
  }),
});

export const CreateCategorySchema = CategorySchema.omit({ id: true }).extend({
  descripcion: z
    .string()
    .trim()
    .max(100, CATEGORY_ERRORS.descriptionLength)
    .nullable()
    .default(null),
  color: z
    .enum(CATEGORY_COLORS, {
      errorMap: () => ({ message: CATEGORY_ERRORS.invalidColor }),
    })
    .default(DEFAULT_CATEGORY_COLOR),
});
export const UpdateCategorySchema = CreateCategorySchema.partial();

export type Category = z.infer<typeof CategorySchema>;
export type CreateCategoryDTO = z.input<typeof CreateCategorySchema>;
export type UpdateCategoryDTO = z.input<typeof UpdateCategorySchema>;
```

Extensión del contrato de tarea:

```typescript
// shared/src/task.schema.ts — dentro de TaskSchema
categoryId: z.string().nullable().default(null),
```

### 3.2 Error de dominio (`server/src/services/errors.ts`)

```typescript
export type DomainErrorCode = "VALIDATION" | "DUPLICATE_NAME" | "NOT_FOUND";

// Errores de negocio sin ninguna referencia a Express ni a codigos HTTP (constitution C)
export class DomainError extends Error {
  readonly code: DomainErrorCode;
  constructor(message: string, code: DomainErrorCode) {
    super(message);
    this.name = "DomainError";
    this.code = code;
  }
}
```

Mapeo exclusivo del controlador (única capa que conoce HTTP):

| `DomainError.code`   | HTTP                        | Uso                                                                       |
| :------------------- | :-------------------------- | :------------------------------------------------------------------------ |
| `VALIDATION`         | `400 Bad Request`           | Falla de Zod (nombre, descripción, color, categoría inexistente en tarea) |
| `DUPLICATE_NAME`     | `409 Conflict`              | Nombre duplicado global (RF-05) o colisión `E11000` (CL-08)               |
| `NOT_FOUND`          | `404 Not Found`             | Recurso inexistente en lectura/edición/eliminación                        |
| Excepción no mapeada | `500 Internal Server Error` | Fallo imprevisto (constitution E)                                         |

### 3.3 `CategoryService` — firmas y algoritmo crítico

```typescript
export const CategoryService = {
  async findAll(): Promise<Category[]>,
  async create(data: CreateCategoryDTO): Promise<Category>,
  async update(id: string, data: UpdateCategoryDTO): Promise<Category | null>,
  async remove(id: string): Promise<boolean>,
};
```

```typescript
// Clave de unicidad global: recortada y en minusculas, sin alterar acentos
function buildNameKey(nombre: string): string {
  return nombre.trim().toLowerCase();
}

// Normalizacion de descripcion: ausente o solo espacios => null
function normalizeDescription(value: unknown): string | null;

// Pseudocódigo del flujo de creacion
create(data):
  1. nombre = trim(data.nombre); descripcion = normalizeDescription(data.descripcion)
  2. validated = CreateCategorySchema.parse(...)          // falla => DomainError(msg, 'VALIDATION')
  3. exists = CategoryModel.findOne({ nameKey: buildNameKey(nombre) })
     si existe => throw DomainError(CATEGORY_ERRORS.duplicateName, 'DUPLICATE_NAME')
  4. doc = CategoryModel.create({ ...validated, nameKey })
     capturar err.code === 11000 => throw DomainError(duplicateName, 'DUPLICATE_NAME')   // carrera concurrente (CL-08)
  5. mapeo canonico: { id: _id.toString(), nombre, descripcion, color } (sin nameKey, _id, __v)

update(id, data):
  1. normalize + UpdateCategorySchema.parse(...)          // mismas reglas de validacion que create (RF-02)
  2. si trae nombre: findOne({ nameKey, _id: { $ne: id } })  // autoexclusion del propio registro (CL-05)
  3. findByIdAndUpdate(id, { $set: validated + nameKey solo si cambio el nombre }, { new: true })
  4. si el documento no existe => return null (controlador responde 404)

remove(id):
  1. doc = findByIdAndDelete(id); si no existe => return false (controlador responde 404)
  2. TaskModel.updateMany({ categoryId: id }, { $set: { categoryId: null } })   // RF-03: desvincula, no borra tareas

findAll():
  docs = CategoryModel.find().lean()
  // Orden alfabetico ascendente, insensible a mayusculas pero sensible a acentos (spec Seccion 4)
  sort por nombre.localeCompare(other, 'es', { sensitivity: 'accent' })
```

### 3.4 `TaskService` — relación opcional con categoría (RF-10)

```typescript
// En create y update, unicamente cuando categoryId es un string no nulo
if (typeof payload.categoryId === "string") {
  const exists = await CategoryModel.exists({ _id: payload.categoryId }); // cualquier error de cast => no existe
  if (!exists)
    throw new DomainError(CATEGORY_ERRORS.taskCategoryNotFound, "VALIDATION");
}
// categoryId null o ausente es siempre valido (CL-10)
```

### 3.5 Contratos de cliente

```typescript
// client/src/api/categoriesApi.ts — ante !response.ok lanza Error(payload.error)
export const getCategories = async (): Promise<Category[]>;
export const createCategory = async (payload: CreateCategoryDTO): Promise<Category>;
export const updateCategory = async (id: string, payload: UpdateCategoryDTO): Promise<Category>;
export const deleteCategory = async (id: string): Promise<void>;

// client/src/hooks/useCategories.ts
export const CATEGORY_KEYS = { all: ['categories'] as const };
export const useCategoriesQuery = (): UseQueryResult<Category[], Error>;
export const useCreateCategoryMutation / useUpdateCategoryMutation / useDeleteCategoryMutation;
// Todas las mutaciones invalidan CATEGORY_KEYS.all en onSuccess.

// client/src/components/CategoryModal.tsx
type Mode = 'list' | 'create' | 'edit' | 'delete_confirm';
// Borradores (nombre, descripcion, color) en useState local; el componente se desmonta al cerrar
// => RF-09: descarte automatico sin useEffect (evita react-hooks/set-state-in-effect, ver MEMORY).
// Validacion previa al dispatch con CreateCategorySchema/UpdateCategorySchema.safeParse(shared).
// Paleta: exactamente CATEGORY_COLOR_OPTIONS (5 botones con backgroundColor = hex).
```

### 3.6 Títulos de test exactos (contrato con el verificador)

Los títulos deben escribirse literalmente así, porque `.seb/bin/seb verify categorias` filtra con `-t` (regex sobre el nombre del test):

- `server/src/services/category.service.spec.ts`: `RF-01 | creación con color por defecto blanco y nombre recortado`, `RF-01 | descripción vacía o de solo espacios se persiste como null`, `RF-05 | rechaza nombre duplicado ignorando mayúsculas y espacios extremos`, `RF-05 | mapea el error de clave duplicada de la base de datos`, `RF-05 | permite editar una categoría conservando su propio nombre`, `RF-06 | rechaza nombre menor a 3 o mayor a 25 caracteres`, `RF-07 | acepta descripción vacía y rechaza descripción mayor a 100 caracteres`, `RF-08 | rechaza color fuera del catálogo cerrado`, `RF-02 | revalida nombre, descripción y color en la edición`, `RF-04 | devuelve todas las categorías ordenadas alfabéticamente sin distinguir mayúsculas`, `RF-03 | elimina físicamente la categoría`, `RF-03 | desvincula las tareas asociadas al eliminar la categoría`, `RF-03 | libera el nombre para futuras creaciones después de eliminar`, `RNF-01 | repetir la misma edición deja el recurso en el mismo estado`, `RNF-01 | repetir la eliminación de una categoría ya eliminada no altera el estado`, `RNF-02 | el listado no depende del usuario porque el catálogo es global`.
- `server/src/models/Category.spec.ts`: `RF-05 | declara índice único sobre el nombre normalizado`.
- `server/src/services/task.service.spec.ts`: `RF-10 | rechaza crear una tarea con categoría inexistente`, `RF-10 | rechaza editar una tarea con categoría inexistente`, `RF-10 | permite crear y editar tareas sin categoría asociada`.
- `server/src/controllers/task.controller.spec.ts`: `RF-10 | responde 400 con el mensaje de categoría inexistente`.
- `server/src/controllers/category.controller.spec.ts`: `RF-01 | responde 201 con la categoría creada`, `RF-05 | responde 409 Conflict con payload estructurado de duplicado`, `RF-06 | responde 400 con payload estructurado de nombre`, `RF-07 | responde 400 con payload estructurado de descripción`, `RF-08 | responde 400 con payload estructurado de color`, `RF-03 | responde 204 al eliminar`, `CL-07 | responde 404 al eliminar una categoría inexistente`, `RNF-01 | repetir la eliminación de una categoría inexistente responde 404 sin alterar estado`.
- `server/src/routes/category.routes.spec.ts`: `RNF-02 | las rutas de categorías montan el middleware de identidad autenticada`.
- `client/tests/categories.spec.ts` (patrón `-g`): `Creación y validación de categorías`, `Edición de categorías con estado local`, `Eliminación de categorías con confirmación`, `Selección de categoría en la creación de tareas`.

## 4. Decisiones Técnicas Justificadas

- **Decisión 1:** Unicidad global garantizada con un campo sombra `nameKey` (nombre recortado en minúsculas) e índice `unique` en MongoDB.
  - _Alternativa descartada:_ solo verificación previa en el servicio (deja la carrera de CL-08 abierta) y índice único con collation `strength: 2` (la semántica de acentos quedaría implícita en ICU y no es verificable con los tests unitarios aislados de `vitest` que usa este repositorio).
- **Decisión 2:** Errores de negocio como `DomainError` con código de dominio; el controlador mapea a `400/404/409`.
  - _Alternativa descartada:_ lanzar errores con código HTTP desde el servicio (violaría el aislamiento de lógica de negocio respecto del transporte HTTP, constitution C) o propagar `ZodError` crudo hasta el controlador (mezclaría contratos y obligaría a cada controlador a leer `error.issues`).
- **Decisión 3:** `categoryId: string | null` en `TaskSchema` en lugar de embedir la categoría o referenciar por nombre.
  - _Alternativa descartada:_ referenciar por `nombre` (un cambio de nombre rompería todas las tareas asociadas) y referencia obligatoria (la spec 005 y CL-10 exigen que la tarea pueda quedar sin categoría).
- **Decisión 4:** Verificación del cliente exclusivamente con Playwright E2E.
  - _Alternativa descartada:_ instalar `vitest` en `client` para unit tests de React (agregar una dependencia requiere aprobación explícita en la spec, constitution B, y la spec 005 no la contiene).
- **Decisión 5:** Borradores de edición en `useState` local del componente, aprovechando el desmonte al cerrar el modal (misma técnica de `key` que ya usa `TaskModal`).
  - _Alternativa descartada:_ guardar el borrador en Zustand (RF-09 exige que los cambios no guardados vivan solo mientras el modal está abierto; el store global los sobreviviría) y usar `useEffect` para inicializar estado (regla `react-hooks/set-state-in-effect` activa en ESLint, ver `MEMORY.md`).
- **Decisión 6:** La lista se ordena en la capa de servicio con `localeCompare('es', { sensitivity: 'accent' })`.
  - _Alternativa descartada:_ ordenar en el frontend (el contrato exige que la API ya devuelva el orden) o usar `sensitivity: 'base'` (ignoraría los acentos, contradiciendo la Sección 4 de la spec).
- **Decisión 7 (Riesgo interpretativo, requiere aprobación):** RF-05 exige `409 Conflict`, que no está enumerado en la constitución Sección E (que lista `400/404/500` como mapeo de validación/recurso inexistente/imprevisto). Se interpreta `409` como "código HTTP estándar" compatible, porque un nombre duplicado no es un fallo de formato sino un conflicto de unicidad. Si se interpreta la lista de la Sección E como exhaustiva, la spec 005 debe volver a `seb-clarificador` antes de implementar.

## 5. Secuencia de Tareas Atómicas (TDD: Test en Rojo -> Código -> Test en Verde)

_Regla para el Agente Implementador: Ejecuta UNA tarea a la vez en orden de dependencia. Primero escribe el test y verifica que falle (Rojo), luego escribe el código mínimo hasta pasar (Verde). Usa identificadores en inglés y comentarios en español dentro del código; sin emojis._

- [ ] **T1. Crear el contrato compartido de categoría y el flujo de creación con color por defecto** (`RF-01`)
  - _Archivos:_ `shared/src/category.schema.ts`, `shared/src/index.ts`, `server/src/models/Category.ts`, `server/src/services/category.service.ts`, `server/src/services/category.service.spec.ts`
  - _Hecho cuando:_ El comando `CHK-01` de `specs/005_categorias_verificador.md` devuelve exit code `0`.
- [ ] **T2. Aplicar validaciones de nombre, descripción y color con los mensajes exactos de la spec** (`RF-06`, `RF-07`, `RF-08`, `CL-02`, `CL-03`)
  - _Archivos:_ `shared/src/category.schema.ts`, `server/src/services/category.service.ts`, `server/src/services/category.service.spec.ts`
  - _Hecho cuando:_ El comando `CHK-03` devuelve exit code `0`.
- [ ] **T3. Garantizar la unicidad global de nombre en base de datos y con autoexclusión en edición** (`RF-05`, `CL-01`, `CL-05`, `CL-08`)
  - _Archivos:_ `server/src/services/category.service.ts`, `server/src/services/category.service.spec.ts`, `server/src/models/Category.spec.ts`, `server/src/services/errors.ts`
  - _Hecho cuando:_ El comando `CHK-02` devuelve exit code `0`.
- [ ] **T4. Implementar la edición revalidando todos los campos** (`RF-02`)
  - _Archivos:_ `server/src/services/category.service.ts`, `server/src/services/category.service.spec.ts`
  - _Hecho cuando:_ El comando `CHK-04` devuelve exit code `0`.
- [ ] **T5. Devolver el listado global ordenado alfabéticamente** (`RF-04`)
  - _Archivos:_ `server/src/services/category.service.ts`, `server/src/services/category.service.spec.ts`
  - _Hecho cuando:_ El comando `CHK-05` devuelve exit code `0`.
- [ ] **T6. Eliminar categorías con borrado físico y desvinculación de tareas** (`RF-03`, `CL-06`, `CL-09`)
  - _Archivos:_ `server/src/services/category.service.ts`, `server/src/services/category.service.spec.ts`, `server/src/models/Task.ts`, `shared/src/task.schema.ts`
  - _Hecho cuando:_ El comando `CHK-06` devuelve exit code `0`.
- [ ] **T7. Hacer opcional la relación tarea–categoría y rechazar categorías inexistentes** (`RF-10`, `CL-10`)
  - _Archivos:_ `shared/src/task.schema.ts`, `server/src/models/Task.ts`, `server/src/services/task.service.ts`, `server/src/services/task.service.spec.ts`
  - _Hecho cuando:_ El comando `CHK-07` devuelve exit code `0`.
- [ ] **T8. Exponer la API HTTP con códigos canónicos, idempotencia e identidad autenticada** (`RF-03`, `RF-05`, `RF-06`, `RF-07`, `RF-08`, `RF-10`, `RNF-01`, `RNF-02`, `CL-07`)
  - _Archivos:_ `server/src/controllers/category.controller.ts`, `server/src/controllers/category.controller.spec.ts`, `server/src/controllers/task.controller.ts`, `server/src/controllers/task.controller.spec.ts`, `server/src/routes/category.routes.ts`, `server/src/routes/category.routes.spec.ts`, `server/src/index.ts`
  - _Hecho cuando:_ Los comandos `CHK-08` y `CHK-09` devuelven exit code `0`.
- [ ] **T9. Construir el modal de categorías con paleta, errores y borrado confirmado** (`RF-01` a `RF-09`, `CL-01` a `CL-05`)
  - _Archivos:_ `client/src/api/categoriesApi.ts`, `client/src/hooks/useCategories.ts`, `client/src/components/CategoryModal.tsx`, `client/src/store/uiStore.ts`, `client/src/components/Sidebar.tsx`, `client/src/App.tsx`, `client/tests/categories.spec.ts`
  - _Hecho cuando:_ Los comandos `CHK-10`, `CHK-11` y `CHK-12` devuelven exit code `0`.
- [ ] **T10. Reemplazar los botones de categoría hardcodeados del TaskModal por el selector dinámico** (`RF-04`, `RF-10`, `CL-10`)
  - _Archivos:_ `client/src/components/TaskModal.tsx`, `client/tests/categories.spec.ts`
  - _Hecho cuando:_ El comando `CHK-13` devuelve exit code `0`.

> **Gates globales (sin tarea propia):** Tras T10, los comandos `CHK-98` y `CHK-99` deben devolver exit code `0`; la aprobación exige 100% de los controles en `[PASA]`.
