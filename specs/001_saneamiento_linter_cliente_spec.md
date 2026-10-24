# Spec 001 — Saneamiento de Análisis Estático y Sincronización de Estado en el Diálogo de Tareas

- **Tarea ID:** `001`
- **Identificador:** `saneamiento_linter_cliente`
- **Origen:** Prosa
- **Estado:** `APROBADA`

## 1. Contexto y Objetivo (El POR QUÉ)

El módulo de interfaz de usuario presenta actualmente cinco infracciones en la auditoría de análisis estático originadas por mutaciones síncronas de estado dentro de ciclos de efectos secundarios al abrir o alternar el diálogo de creación y edición de tareas. Estas infracciones provocan renderizados en cascada innecesarios, degradan la predecibilidad del ciclo de vida de la vista y bloquean el cumplimiento de las reglas de calidad e higiene del proyecto. El objetivo de esta especificación es erradicar la totalidad de los errores y advertencias del analizador estático garantizando que la inicialización, edición, validación y reinicio del formulario de tareas mantengan su comportamiento funcional íntegro.

## 2. Actores y Usuarios

- **Usuario Final:** Persona que crea o edita tareas a través del diálogo modal de gestión de tareas en la interfaz web.
- **Sistema de Integración Continua / Verificador:** Proceso automatizado que audita la calidad estática del código, la compilación y las pruebas de extremo a extremo del cliente web.

## 3. Historias de Usuario

- **HU-01:** Como desarrollador del equipo, quiero que el módulo cliente supere la verificación de análisis estático con cero errores y cero advertencias para garantizar un flujo de renderizado determinista y libre de efectos secundarios no controlados.
- **HU-02:** Como usuario final, quiero abrir el diálogo de tareas tanto para crear una nueva tarea como para editar una existente y ver los campos del formulario inicializados de forma inmediata y consistente sin parpadeos ni datos residuales.

## 4. Definiciones de Dominio (Opcional)

- **Diálogo de Gestión de Tareas:** Ventana modal encargada de capturar los atributos de una tarea (título, descripción, puntos de esfuerzo en escala Fibonacci y fecha de vencimiento) tanto en modo de alta como en modo de modificación.
- **Sincronización de Estado sin Efectos Secundarios:** Mecanismo mediante el cual los valores iniciales de un formulario se derivan o reinician al cambiar la entidad activa o el estado de apertura del diálogo, sin disparar mutaciones de estado síncronas encadenadas tras el primer renderizado.

## 5. Requisitos Funcionales (Criterios de Aceptación en EARS)

- **RF-01 (Ubiquitous):** EL SISTEMA DEBE superar la ejecución del analizador estático de código del módulo cliente con código de salida 0, registrando exactamente 0 errores y 0 advertencias.
- **RF-02 (Event-Driven):** CUANDO el usuario abre el diálogo de gestión de tareas en modo de creación (sin tarea existente seleccionada), EL SISTEMA DEBE presentar el formulario inicializado con el título vacío, la descripción vacía, la estimación en 1 punto de historia, la fecha de vencimiento vacía y sin mensajes de error activos.
- **RF-03 (Event-Driven):** CUANDO el usuario abre el diálogo de gestión de tareas seleccionando una tarea existente para su edición, EL SISTEMA DEBE presentar el formulario precargado con el título, la descripción, los puntos de historia y la fecha de vencimiento en formato año-mes-día (`YYYY-MM-DD`) de dicha tarea desde su primer renderizado visible.
- **RF-04 (Event-Driven):** CUANDO el usuario cierra el diálogo de gestión de tareas y lo vuelve a abrir alternando entre modo de edición y modo de creación (o entre dos tareas distintas), EL SISTEMA DEBE actualizar todos los campos del formulario al nuevo contexto activo sin conservar valores ni errores de validación de la apertura previa.
- **RF-05 (Unwanted Behavior):** SI el usuario intenta confirmar la creación o edición de una tarea cuyo título esté vacío o contenga únicamente espacios en blanco, ENTONCES EL SISTEMA DEBE cancelar el envío de la operación y mostrar un mensaje de validación indicando que el título es obligatorio.

## 6. Requisitos No Funcionales (Verificables)

- **RNF-01:** La compilación estricta de tipos y empaquetado del módulo cliente debe finalizar con código de salida 0 sin introducir exclusiones o desactivaciones de reglas del analizador estático.
- **RNF-02:** La totalidad de la suite de pruebas de extremo a extremo del módulo cliente debe ejecutarse y aprobar al 100% (código de salida 0) tras la refactorización del manejo de estado del diálogo.

## 7. Casos Límite (Edge Cases)

- **CL-01 (Valores vacíos / nulos / duplicados):** Al editar una tarea existente que carece de descripción (`description` ausente) o de fecha de vencimiento (`dueDate` ausente), el formulario debe inicializar dichos campos como cadenas de texto vacías sin generar errores de ejecución ni valores indefinidos en los controles de entrada.
- **CL-02 (Límites numéricos / paginación / concurrencia):** El selector de estimación de esfuerzo dentro del diálogo debe restringir las opciones seleccionables exclusivamente a la secuencia Fibonacci permitida por el dominio (`0, 1, 2, 3, 5, 8, 13, 21`).

## 8. Fuera de Alcance (Out of Scope)

- Modificaciones en los contratos de datos compartidos o esquemas de validación del dominio.
- Cambios en los controladores, servicios o persistencia del servidor backend.
- Alteraciones al sistema de diseño visual neoplástico (paleta cromática, bordes estructurales o tipografía) del diálogo de tareas.
- Incorporación de nuevas dependencias externas en el proyecto.

## 9. Criterios de Finalización (Definition of Done)

- Todos los requisitos (`RF-01` a `RF-05`) cuentan con verificación programática en `[PASA]` ejecutada mediante `.seb/bin/seb verify saneamiento_linter_cliente`.
- Cero violaciones a `docs/constitution.md`.

## 10. Dudas Abiertas y Puntos por Clarificar

- Ninguna duda pendiente.
