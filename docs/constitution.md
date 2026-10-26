# Constitución del Proyecto — Brienne

> **Ley Suprema (`seb-harness`):** Este documento define los principios innegociables del proyecto. Toda especificación (`*_spec.md`), plan (`*_plan.md`), verificador (`*_verificador.md`) e implementación debe cumplirlos estrictamente.

## A. Naturaleza del Proyecto

- **Propósito y Misión:** Brienne es un sistema integral de gestión y visualización de tareas orientado a la productividad personal y de equipos ágiles, cuyo núcleo de experiencia visual está estrictamente gobernado por los principios del Neoplasticismo (estética Mondrian).
- **Usuarios / Consumidores:** Usuarios finales que interactúan mediante la interfaz gráfica web SPA (React 19) y clientes HTTP que consumen la API RESTful (Express).
- **Tipo de Sistema y Alcance:** Monorepo modular (`pnpm workspaces`) compuesto por tres paquetes principales: `client` (frontend web), `server` (API de persistencia y lógica de negocio) y `shared` (esquemas de validación y tipos compartidos). El alcance actual cubre la creación, lectura, actualización, marcado de estado y eliminación de tareas, con estimación en Story Points y segmentación por agenda.

## B. Stack Tecnológico (Reglas de Implementación)

- **Lenguaje y Runtime:** TypeScript 5.5+, Node.js v22 (LTS), gestionado de forma determinista y reproducible bajo NixOS mediante `flake.nix` y `direnv`.
- **Frameworks y Librerías Core:**
  - **Monorepo:** `pnpm` con workspaces declarados en `pnpm-workspace.yaml`.
  - **Shared (`@brienne/shared`):** Zod 3.x para validación bidireccional de esquemas de datos y contratos de tipos TS.
  - **Backend (`server`):** Express 4.x, Mongoose 8.x, `dotenv`, `cors`. Testing con `vitest`.
  - **Frontend (`client`):** React 19.x, Vite 8.x, TanStack Query (React Query) v5, Zustand v5, Tailwind CSS 4.x (PostCSS), `date-fns` v4.
  - **E2E Testing:** Playwright v1.6x con aislamiento mediante mocks de red (`page.route()`).
- **Persistencia e Infraestructura:**
  - MongoDB 7.0 desplegado localmente vía `docker-compose.yml` en el puerto `27017:27017`.
  - Contenedor canónico: `brienne_mongo`.
- **Comandos Oficiales de Verificación Programática:**
  Todo comando debe ejecutarse con el prefijo `direnv exec .` para garantizar el aislamiento y la resolución de dependencias del entorno NixOS:
  - **Compilación / Build Global:** `direnv exec . pnpm -r build`
  - **Compilación por Paquete:** `direnv exec . pnpm --filter <shared|server|client> build`
  - **Tests Unitarios Backend:** `direnv exec . pnpm --filter server test`
  - **Tests E2E Frontend:** `direnv exec . pnpm --filter client test` (o `direnv exec . npx playwright test`)
  - **Linter / Análisis Estático:** `direnv exec . pnpm --filter client lint`
- **Prohibiciones de Stack:**
  - Prohibido agregar nuevas dependencias externas en cualquier paquete sin aprobación explícita y justificada en la spec y el plan de trabajo.
  - Prohibido reemplazar librerías core existentes (por ejemplo, reemplazar Zustand por Redux, o Mongoose por Prisma) sin revisión formal de arquitectura.
  - Prohibido omitir `direnv exec .` en comandos automáticos ejecutados por agentes o scripts CI en este entorno.

## C. Reglas de Dominio y Lógica de Negocio

- **Invariantes del Dominio:**
  - Toda tarea (`Task`) debe poseer un título no vacío (`title.length >= 1`).
  - La estimación de esfuerzo (`points`) debe pertenecer obligatoriamente a la secuencia Fibonacci permitida: `0, 1, 2, 3, 5, 8, 13, 21`. Valores fuera de este conjunto son rechazados por validación en `shared`.
  - Toda tarea debe tener asignado un creador / propietario (`ownerId`).
  - El estado inicial de finalización (`completed`) es `false`.
- **Fronteras de Datos y Consistencia:**
  - El contrato canónico de datos reside exclusivamente en `@brienne/shared/src/task.schema.ts`. Ni el backend ni el frontend pueden redefinir interfaces o validaciones desacopladas de esta fuente única.
  - Persistencia de fechas: Todas las marcas de tiempo (`dueDate`, `createdAt`, `updatedAt`) se gestionan en formato ISO 8601 en UTC.
  - Idempotencia: Las operaciones de modificación de tareas (`PATCH /api/tasks/:id`) deben garantizar consistencia parcial sin sobreescribir campos ausentes en el payload.
- **Aislamiento de Lógica:**
  - La lógica de negocio reside en la capa de servicios (`server/src/services/`) y en funciones puras auxiliares, totalmente desacoplada del transporte HTTP (controladores Express) para permitir pruebas unitarias sin levantar el servidor HTTP ni la base de datos real.

## D. Estructura y Estilo de Código

- **Topología de Directorios:**
  - `client/src/components/`: Componentes de interfaz de usuario desacoplados.
  - `client/src/hooks/`: Hooks de React Query (`useTasks`) y consumo de APIs.
  - `client/src/store/`: Stores globales de UI gestionados exclusivamente con Zustand (`uiStore.ts`).
  - `client/src/api/`: Cliente de red tipado que interactúa con el backend.
  - `server/src/controllers/`: Manejadores HTTP que orquestan requests y delegan en servicios.
  - `server/src/services/`: Lógica de negocio y acceso a datos.
  - `server/src/models/`: Modelos Mongoose tipados con las interfaces de `@brienne/shared`.
  - `server/src/middlewares/`: Middlewares Express (autenticación, logs, manejo de errores).
  - `shared/src/`: Esquemas Zod y tipos exportados compartidos entre cliente y servidor.
- **Patrones Arquitectónicos y de Diseño:**
  - **Frontend:** Separación estricta entre Estado del Servidor (Server State via TanStack Query) y Estado de la UI (Client State via Zustand). Prohibido duplicar datos de la API en Zustand.
  - **Sistema de Diseño Neoplástico (Mondrian):** Reglas innegociables de UI descritas en `DESIGN.md`:
    - Cero bordes redondeados (`border-radius: 0` absoluto; prohibido `rounded-*` en Tailwind).
    - Separadores con peso estructural: bordes negros gruesos (4px a 8px). Prohibido el uso de divisores estándar de 1px.
    - Cero sombras difusas tradicionales (`box-shadow` suaves prohibidas; usar sombras duras rectangulares de desplazamiento sólido o superposiciones planas).
    - Paleta cromática primaria estricta: Rojo (`#bc0002`), Azul (`#2c4bdb`), Amarillo (`#715d00`), Blanco puro y Negro.
    - Tipografía: Inter para jerarquía estructural y Space Grotesk para etiquetas/metadatos técnicos.
- **Convenciones de Nomenclatura e Idioma:**
  - Todo el código fuente (nombres de variables, funciones, clases, archivos, interfaces, commits y rutas) debe estar en **inglés**.
  - Los comentarios explicativos dentro del código y la documentación técnica de soporte deben estar estrictamente en **español**.
  - Queda estrictamente prohibido el uso de emojis dentro de archivos de código, tests o configuraciones.
- **Prohibiciones de Diseño:**
  - Prohibido acoplar controladores Express directamente a Mongoose sin pasar por la capa de servicio.
  - Prohibido invocar mutaciones directas sobre el DOM o usar hooks con efectos secundarios no controlados en React (`react-hooks/set-state-in-effect`).

## E. Manejo de Errores y Validaciones

- **Estrategia de Errores:**
  - El backend debe capturar errores y retornar respuestas JSON estructuradas con códigos HTTP estándar (`400 Bad Request` para fallos de validación, `404 Not Found` para recursos inexistentes, `500 Internal Server Error` para fallos imprevistos).
  - Toda respuesta de error debe contener un payload estructurado: `{ "error": string, "details"?: unknown }`.
- **Validación de Entradas:**
  - Validación obligatoria con esquemas Zod en la frontera del sistema:
    - En el backend: Los endpoints de mutación (`POST`, `PATCH`) validan el `req.body` contra `TaskSchema` o sus variantes DTO antes de llegar a la lógica de negocio.
    - En el frontend: Validación reactiva en formularios antes del despacho del payload a la API.
- **Observabilidad, Seguridad e Identidad:**
  - **Identidad (Hodor Placeholder):** Actualmente gestionada mediante un mock contractual en `server/src/middlewares/auth.ts` que inyecta `req.user = { id: 'user-hodor-123' }`. Se mantiene hasta la integración definitiva con el proveedor Hodor.
  - Prohibido registrar en logs (`console.log`, `console.error`) datos sensibles, credenciales de conexión o tokens de autenticación.

## F. Comportamiento del Agente de IA (Reglas SDD — `seb-harness`)

1. **La Spec Manda:** Ninguna funcionalidad se implementa sin un archivo `specs/<NNN>_<tarea>_spec.md` formalmente aprobado y sin etiquetas `[NECESITA ACLARACIÓN]`.
2. **Testabilidad Programática Obligatoria:** Ningún plan (`specs/<NNN>_<tarea>_plan.md`) es válido sin su correspondiente `specs/<NNN>_<tarea>_verificador.md` con comandos ejecutables que devuelvan código de salida `0`.
3. **Anti-Reward-Hacking:** Está terminantemente prohibido modificar `docs/constitution.md`, `specs/*_spec.md` o `specs/*_verificador.md` durante la implementación, así como deshabilitar, relajar o comentar tests existentes para forzar un resultado exitoso.
4. **Memoria Persistente (`MEMORY.md`):** Antes de planificar o codificar, el agente debe consultar `MEMORY.md` para evitar callejones sin salida ya documentados, y registrar allí cualquier nueva limitación técnica descubierta.
5. **Commits Protegidos:** Todo commit de código debe pasar la puerta determinista `.seb/bin/seb verify <tarea>`.
