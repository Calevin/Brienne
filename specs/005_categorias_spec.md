# Spec 005 — Gestión de Categorías

- **Tarea ID:** `005`
- **Identificador:** `categorias`
- **Origen:** Prosa del usuario
- **Estado:** `APROBADA`

## 1. Contexto y Objetivo (El POR QUÉ)

El sistema Brienne necesita permitir a los usuarios crear, editar, eliminar y seleccionar categorías reutilizables al crear tareas, facilitando la organización y filtrado de las mismas.

Las categorías son un catálogo global y compartido: su nombre es único en todo el sistema y cualquier usuario autenticado las ve y gestiona. Las tareas pueden referenciar cero o una categoría.

## 2. Actores y Usuarios

- **Usuario Final:** Cualquier usuario autenticado que interactúe con la aplicación web.

## 3. Historias de Usuario

- **HU-01:** Como usuario, quiero crear una categoría especificando nombre, descripción y color para organizar mis tareas.
- **HU-02:** Como usuario, quiero editar una categoría existente para actualizar su información.
- **HU-03:** Como usuario, quiero eliminar una categoría que ya no sea útil.
- **HU-04:** Como usuario, quiero seleccionar una categoría al crear una nueva tarea para clasificarla.

## 4. Definiciones de Dominio

- **Categoría:** Entidad con identidad propia y los campos `nombre` (string obligatorio), `descripcion` (string opcional o `null`) y `color` (string obligatorio).
- **Catálogo cromático:** Conjunto cerrado de cinco colores coherentes con la triada primaria neoplástica. El valor canónico es el código hexadecimal en minúsculas; la interfaz muestra el nombre de color.

  | Nombre de color | Valor canónico |
  | :-------------- | :------------- |
  | Rojo            | `#bc0002`      |
  | Azul            | `#2c4bdb`      |
  | Amarillo        | `#fac901`      |
  | Negro           | `#000000`      |
  | Blanco          | `#ffffff`      |

  El color por defecto es Blanco (`#ffffff`).

- **Normalización del nombre:** Para toda comparación se eliminan los espacios al inicio y al final y se ignora la diferencia entre mayúsculas y minúsculas. El valor almacenado conserva el texto original recortado (espaciado interno y capitalización incluidos). Los acentos son significativos: `Trabajó` y `Trabajo` son nombres distintos.
- **Normalización de la descripción:** Se eliminan los espacios al inicio y al final. Un valor ausente o compuesto únicamente por espacios se almacena como `null`.
- **Unicidad:** El nombre de categoría es único de forma global en el sistema, comparado según la normalización del nombre. La unicidad se garantiza en la capa de persistencia, no solo en la interfaz.
- **Relación Tarea–Categoría:** Una tarea puede tener cero o una categoría asociada, referenciada por su identidad. La categoría es opcional al crear o editar una tarea.

## 5. Requisitos Funcionales (Criterios de Aceptación en EARS)

- **RF-01 (Ubiquitous):** EL SISTEMA DEBE permitir que cualquier usuario autenticado pueda crear una nueva categoría proporcionando un nombre obligatorio, una descripción opcional y un color opcional; SI no se proporciona color, ENTONCES EL SISTEMA DEBE asignar Blanco (`#ffffff`).
- **RF-02 (Event-Driven):** CUANDO un usuario autenticado confirma la edición de una categoría existente, EL SISTEMA DEBE guardar los cambios de cualquiera de sus campos aplicando las mismas validaciones de creación (RF-05 a RF-08).
- **RF-03 (Event-Driven):** CUANDO un usuario autenticado confirma la eliminación de una categoría, EL SISTEMA DEBE eliminar físicamente el registro y desasociar la categoría de todas las tareas que la referenciaban, sin eliminar ninguna tarea.
- **RF-04 (Event-Driven):** CUANDO un usuario solicita la lista de categorías, EL SISTEMA DEBE devolver todas las categorías del sistema ordenadas alfabéticamente de forma ascendente por nombre, sin distinguir mayúsculas y minúsculas.
- **RF-05 (Unwanted Behavior):** SI el nombre de la categoría, según la normalización definida, ya existe en otra categoría del sistema, ENTONCES EL SISTEMA DEBE mostrar el mensaje de error "Nombre de categoría duplicado", prevenir el guardado y, en la API, responder con código `409 Conflict` y payload `{ "error": "Nombre de categoría duplicado" }`. En la edición, la comparación excluye a la propia categoría editada.
- **RF-06 (Unwanted Behavior):** SI el nombre de la categoría, tras eliminar los espacios al inicio y al final, tiene una longitud menor a 3 o mayor a 25 caracteres, ENTONCES EL SISTEMA DEBE mostrar el mensaje de error "El nombre debe tener entre 3 y 25 caracteres" y prevenir el guardado, respondiendo en la API con código `400 Bad Request`.
- **RF-07 (Unwanted Behavior):** SI la descripción, tras eliminar los espacios al inicio y al final, supera los 100 caracteres, ENTONCES EL SISTEMA DEBE mostrar el mensaje de error "La descripción no puede superar los 100 caracteres" y prevenir el guardado, respondiendo en la API con código `400 Bad Request`. La descripción no tiene longitud mínima.
- **RF-08 (Unwanted Behavior):** SI el color no pertenece al catálogo cromático definido, ENTONCES EL SISTEMA DEBE mostrar el mensaje de error "Color no permitido" y prevenir el guardado, respondiendo en la API con código `400 Bad Request`.
- **RF-09 (State-Driven):** MIENTRAS el modal de edición de una categoría está abierto, EL SISTEMA DEBE mantener los cambios no guardados en el estado local. Al cerrar el modal por guardado, cancelación o descarte, EL SISTEMA DEBE descartar los cambios no confirmados.
- **RF-10 (Unwanted Behavior):** SI al crear o editar una tarea se referencia una categoría inexistente, ENTONCES EL SISTEMA DEBE mostrar el mensaje de error "Categoría inexistente", prevenir el guardado y, en la API, responder con código `400 Bad Request`. Una tarea sin categoría es válida.

## 6. Requisitos No Funcionales (Verificables)

- **RNF-01:** La API de categorías debe respetar los códigos y el payload de error definidos en `docs/constitution.md` y comportarse de forma idempotente en las operaciones de lectura, edición y eliminación:
  - Repetir la misma edición (`PATCH`) deja el recurso en el mismo estado final.
  - Repetir la eliminación de una categoría ya eliminada no altera el estado del sistema y responde `404 Not Found`.
  - La creación (`POST`) no es idempotente: ante un nombre duplicado no se crea un segundo registro y se responde `409 Conflict` (RF-05).
- **RNF-02:** Al ser las categorías un catálogo global, cualquier usuario autenticado puede crear, editar y eliminar cualquier categoría; no existe propiedad por usuario. El acceso a la API de categorías exige identidad autenticada según el mecanismo vigente en la constitución.

## 7. Casos Límite (Edge Cases)

- **CL-01:** Crear o editar una categoría con un nombre ya existente, incluyendo variantes que solo difieran en espacios al inicio/final o en mayúsculas/minúsculas, produce el error de duplicado (RF-05).
- **CL-02:** Enviar nombre vacío, ausente o compuesto solo por espacios se rechaza por longitud mínima (RF-06). Enviar descripción vacía, ausente o compuesta solo por espacios se acepta y se almacena como `null` (RF-07).
- **CL-03:** Enviar un color fuera del catálogo cromático, o con formato distinto al hexadecimal canónico, se rechaza (RF-08).
- **CL-04:** Cancelar o cerrar el modal de edición sin guardar descarta los cambios y deja intacto el registro persistido (RF-09).
- **CL-05:** Editar una categoría sin modificar su nombre no produce error de duplicado (RF-05).
- **CL-06:** Eliminar una categoría referenciada por una o varias tareas desasocia esas tareas y no las elimina (RF-03).
- **CL-07:** Intentar eliminar una categoría inexistente responde `404 Not Found` sin alterar el estado.
- **CL-08:** Dos creaciones concurrentes con el mismo nombre producen una sola categoría; la segunda responde `409 Conflict` (RF-05, RNF-01).
- **CL-09:** Eliminar una categoría libera su nombre normalizado para futuras creaciones (RF-03).
- **CL-10:** Las tareas existentes o nuevas sin categoría asociada son válidas y permanecen operativas (RF-10).

## 8. Fuera de Alcance (Out of Scope)

- No se incluirá gestión de permisos granulares ni propiedad por usuario: las categorías son globales.
- No se implementará una interfaz de arrastrar y soltar para reordenar categorías; el orden es siempre alfabético ascendente.
- No se crearán categorías predeterminadas ni se implementará siembra automática al iniciar la aplicación.
- No se implementará borrado lógico ni restauración de categorías.
- No se implementarán los filtros por categoría de la Spec 004; esa spec se actualizará en una tarea posterior.

## 9. Criterios de Finalización (Definition of Done)

- Todos los requisitos (`RF-01` a `RF-10`) cuentan con verificación programática en `[PASA]` ejecutada mediante `.seb/bin/seb verify categorias`.
- Cero violaciones a `docs/constitution.md`.
- Documentación actualizada y pruebas unitarias/e2e que cubran los casos descritos.

## 10. Dudas Abiertas y Puntos por Clarificar

Sin dudas abiertas.
