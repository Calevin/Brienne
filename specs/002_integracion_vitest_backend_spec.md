# Spec 002 — Integración Formal del Entorno de Pruebas Automatizadas en el Módulo Backend

- **Tarea ID:** `002`
- **Identificador:** `integracion_vitest_backend`
- **Origen:** Prosa
- **Estado:** `APROBADA`

## 1. Contexto y Objetivo (El POR QUÉ)

El módulo servidor del proyecto carece actualmente de un mecanismo automatizado, aislado y reproducible para ejecutar pruebas unitarias sobre su lógica de negocio. Esta carencia representa una deuda técnica documentada (`DEBT-01`), impide la verificación determinista de los servicios del backend antes de los despliegues y vulnera la directriz de testing continuo establecida en la constitución del sistema. El objetivo de esta especificación es formalizar el entorno de pruebas unitarias enfocado estrictamente en la capa de servicios del servidor backend, garantizando que cualquier desarrollador o agente de integración continua pueda validar la lógica de creación, consulta, actualización, eliminación y cumplimiento de invariantes de negocio de forma desacoplada de la base de datos física, sin efectos secundarios, con un umbral de cobertura mínimo del 75% y con retroalimentación inmediata en modo no interactivo.

## 2. Actores y Usuarios

- **Desarrollador / Agente de Implementación:** Ingeniero o agente autónomo que escribe y verifica la lógica de servicios del backend.
- **Sistema de Integración Continua / Verificador:** Proceso automatizado que audita la salud del sistema y ejecuta la suite de pruebas como compuerta de calidad determinista.

## 3. Historias de Usuario

- **HU-01:** Como desarrollador del backend, quiero ejecutar un comando estandarizado de pruebas para comprobar de forma instantánea y determinista la corrección de los servicios de negocio sin necesidad de inicializar bases de datos externas ni servidores HTTP reales.
- **HU-02:** Como sistema de integración continua, quiero que la suite de pruebas del backend se ejecute en modo desatendido (no interactivo), devolviendo un código de salida exitoso únicamente cuando todas las aserciones se cumplan y la cobertura sobre los servicios alcance al menos el 75%, y un código de error cuando al menos una falle o la cobertura sea insuficiente.

## 4. Definiciones de Dominio

- **Suite de Pruebas de Servicios:** Conjunto de casos de prueba automatizados encargados de verificar de forma aislada el comportamiento, las transformaciones de datos y las reglas de negocio de los servicios (`server/src/services/`).
- **Modo No Interactivo (CI):** Modo de ejecución que realiza una única pasada completa de las pruebas y finaliza inmediatamente el proceso retornando el estado de salida correspondiente, sin entrar en bucles de observación continua de archivos.
- **Aislamiento de Dependencias de Persistencia:** Capacidad de las pruebas de evaluar la lógica de negocio simulando el acceso a datos mediante dobles de prueba (mocks o stubs del modelo), garantizando ejecución autónoma sin conexión a MongoDB ni puertos de red.
- **Umbral de Cobertura:** Porcentaje mínimo medible de líneas, ramas, funciones y sentencias ejecutadas por la suite sobre los archivos de servicio bajo prueba.

## 5. Requisitos Funcionales (Criterios de Aceptación en EARS)

- **RF-01 (Ubiquitous):** EL SISTEMA DEBE proveer un comando de ejecución de pruebas en el módulo del servidor que opere en modo de pasada única no interactiva, mida la cobertura de código y reporte el resultado consolidado en la salida estándar.
- **RF-02 (Event-Driven):** CUANDO se invoque la ejecución de pruebas del módulo del servidor y todas las aserciones resulten satisfactorias alcanzando un mínimo del 75% de cobertura sobre la capa de servicios, EL SISTEMA DEBE finalizar el proceso con código de salida 0.
- **RF-03 (Unwanted Behavior):** SI al menos una aserción dentro de la suite de pruebas falla o la cobertura sobre la capa de servicios no alcanza el 75%, ENTONCES EL SISTEMA DEBE abortar la ejecución reportando el detalle del fallo y finalizar con un código de salida distinto de 0.
- **RF-04 (Event-Driven):** CUANDO se ejecuten las pruebas unitarias de creación de tareas en el servicio, EL SISTEMA DEBE verificar que se asigne el identificador de usuario propietario por defecto en caso de no ser provisto en los datos de entrada.
- **RF-05 (Event-Driven):** CUANDO se ejecuten las pruebas unitarias del servicio de tareas, EL SISTEMA DEBE verificar la correcta transformación del formato de persistencia al formato del contrato de dominio, garantizando la presencia del identificador canónico (`id`) y la exclusión de metadatos internos de almacenamiento (`_id`, `__v`).
- **RF-06 (Event-Driven):** CUANDO se solicite la actualización o eliminación de una tarea inexistente durante las pruebas de servicio, EL SISTEMA DEBE validar que el servicio retorne una respuesta indicativa de recurso ausente (`null` en actualización o `false` en eliminación) sin lanzar excepciones no controladas.
- **RF-07 (Event-Driven):** CUANDO se ejecuten las pruebas de creación de tareas en el servicio, EL SISTEMA DEBE verificar el cumplimiento de las invariantes constitucionales del dominio: estado de completitud inicial (`completed: false`), título con longitud mínima requerida (`title.length >= 1`) y estimación de esfuerzo restringida a la secuencia Fibonacci permitida (`0, 1, 2, 3, 5, 8, 13, 21`).
- **RF-08 (Unwanted Behavior):** SI durante las pruebas del servicio se invocan operaciones de creación con valores de estimación fuera de la secuencia Fibonacci permitida o con títulos vacíos, ENTONCES EL SISTEMA DEBE comprobar que la operación sea rechazada impidiendo su persistencia.

## 6. Requisitos No Funcionales (Verificables)

- **RNF-01:** La suite completa de pruebas unitarias del backend debe ejecutarse en un tiempo total inferior a 10 segundos en entorno local.
- **RNF-02:** La ejecución de las pruebas unitarias del backend debe ser completamente autosuficiente y funcionar sin requerir un demonio de base de datos en ejecución ni puertos de red abiertos.
- **RNF-03:** El comando de pruebas debe ser compatible con la invocación canónica del monorepo mediante el gestor de paquetes del proyecto (`direnv exec . pnpm --filter server test`).
- **RNF-04:** La suite debe emitir métricas de cobertura de código exigiendo un umbral mínimo del 75% sobre la capa de servicios (`server/src/services/`).

## 7. Casos Límite (Edge Cases)

- **CL-01 (Estimación fuera de Fibonacci):** Intentos de persistir tareas con puntos como `4`, `7` o valores negativos deben ser invalidados por las reglas del dominio.
- **CL-02 (Títulos con espacios en blanco):** Cadenas compuestas únicamente por espacios en blanco no deben considerarse títulos válidos.
- **CL-03 (Ausencia de archivos de prueba):** Si el ejecutor de pruebas se invoca en un subdirectorio sin casos de prueba coincidentes, debe retornar un código de estado explicativo o advertencia controlada sin provocar un cuelgue indefinido del proceso.
- **CL-04 (Fallos en operaciones asíncronas):** Si el adaptador de persistencia simulado rechaza una operación asíncrona, la suite debe atrapar la excepción y reportar el fallo específico sin dejar procesos huérfanos en memoria.

## 8. Fuera de Alcance (Out of Scope)

- Pruebas directas sobre los controladores HTTP de Express (`server/src/controllers/`), cuya validación de integración y transporte queda delegada a la suite de pruebas E2E de Playwright.
- Pruebas de integración con base de datos real MongoDB levantada mediante contenedores.
- Modificación del esquema de datos canónico compartido (`@brienne/shared`).
- Alteraciones en componentes visuales o hooks del módulo cliente.

## 9. Criterios de Finalización (Definition of Done)

- La especificación cuenta con aprobación formal en estado `APROBADA` y la totalidad de sus requisitos completamente clarificados.
- Todos los requisitos (`RF-01` a `RF-08`) cuentan con respaldo de verificación programática determinista en `specs/002_integracion_vitest_backend_verificador.md`.
- El comando `direnv exec . pnpm --filter server test` ejecuta la suite de pruebas de servicios, valida aserciones e invariantes y reporta al menos un 75% de cobertura con código de salida 0.
- Se mantiene el cumplimiento irrestricto de `docs/constitution.md`.

## 10. Dudas Abiertas y Puntos por Clarificar

- Ninguna duda pendiente. Las decisiones de frontera (alcance de servicios vs. controladores E2E), verificación de invariantes y umbral del 75% de cobertura fueron ratificadas por el usuario.
