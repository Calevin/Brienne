## Arquitectura: Monorepo gestionado con NPM Workspaces
- ```/client```: Aplicación React construida con Vite.
- ```/server```: API RESTful con Node.js y Express.
- ```/shared```: Paquete interno para compartir tipos TypeScript y esquemas de validación de Zod.

## Estructura 
```text
/Brienne
├── client/          (React 19, Vite, Tailwind CSS, TanStack Query, Zustand)
├── server/          (Express, Mongoose, Auth Placeholder)
├── shared/          (Tipos TypeScript, Esquemas de Zod)
├── docker-compose.yml
├── .env.example
└── package.json
```

## Decisiones Técnicas
1. Estado del Servidor (Server State): Se usa TanStack Query (React Query).
2. Estado del Cliente (Client State): Se usa Zustand, es minimalista, no usa “providers” forzosos y su API es muy limpia.
3. Validación E2E con Zod: Se usa en el paquete paquete ```/shared``` para validar los payloads (ej: validar en el backend antes de guardar en DB, y en el frontend al recibir la data).
4. Tailwind CSS & Date-Fns: Integrados en Vite.
5. Testing con Playwright: Testing E2E.
6. MongoDb como base de datos.

## Root
* ```package.json```: Configuración de NPM Workspaces.
* ```docker-compose.yml```: (local) Servicio básico para MongoDB 
* ```.env.example```: Variables de entorno requeridas (PORT, MONGO_URI).

## Shared (Tipos y Esquemas)
* ```shared/package.json```: Paquete interno para exportar tipos.
* ```shared/src/task.schema.ts```: Definición de las entidades Task usando Zod (incluyendo Fibonacci, arrays, fechas) y exportación de sus correspondientes tipos de TypeScript.

## Backend (Express)
* ```server/package.json```: Dependencias: express, mongoose, zod, cors, tipados.
* ```server/src/models/Task.ts```: Modelo de Mongoose
* ```server/src/middlewares/auth.ts```: (WIP) Middleware placeholder para el Identity Provider (Hodor).
* ```server/src/index.ts```: Punto de entrada de Express y conexión a Mongo. Se importa el router.
* ```server/src/controllers/task.controller.ts```: Controlador que expone `getTasks`, `createTask`, `updateTask`.
* ```server/src/routes/task.routes.ts```: Módulo de rutas de express atando las rutas RESTful a las funciones en el controlador (`GET /`, `POST /`, `PATCH /:id`).

## Frontend (React)
Inicializado con Vite (Template: react-ts).

* ```client/package.json```: Dependencias: react, react-dom, @tanstack/react-query, zustand, date-fns, tailwindcss, postcss, autoprefixer.
* ```client/tailwind.config.js```: Basado en las directivas obtenidas del ```DESIGN.md``` generado con Google Stitch.
* ```client/src/main.tsx```: Punto de entrada con el QueryClientProvider de TanStack Query configurado.
* ```client/src/App.tsx```: Punto de entrada al maquetado y la integración del layout Neo-Plástico Mondrian.
* ```client/src/api/tasksApi.ts```: Funciones nativas usando `fetch` (`getTasks`, `postTask`, `patchTask`). Usando los tipos que se exportan desde el paquete `@brienne/shared`.
* ```client/src/hooks/useTasks.ts```: Custom hook que encapsula  `useQuery` y `useMutation` provistas por React Query.

> `useTasks()`: Llamará a `api.getTasks()` (`tasksApi.ts`)

> `createTaskMutation()`: Expondrá la mutación para hacer POST, e invalidará la query de la lista al resolverse exitosamente, para el refetch automático y tener la lista actualizada.

*  ```client/src/components/TaskFeed.tsx```: Se usa `const { data, isLoading } = useTasks()`. Mientras `isLoading` es true, se muestran skeletons.
* ```client/src/components/TaskModal.tsx```: Al enviar el formulario invoca la mutación `mutate(nuevaTarea)` del hook `createTaskMutation`.
* ```client/src/components/AgendaHoy.tsx```: Tambien consumira el hook `TaskFeed` pero se enfocará en renderizar las fechas específicas, filtrando aquellas pre-formateadas según el modelo.