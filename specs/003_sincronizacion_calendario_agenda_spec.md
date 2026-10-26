# Spec 003 — Sincronización Bidireccional de Calendario y Agenda Diaria

- **Tarea ID:** `003`
- **Identificador:** `sincronizacion_calendario_agenda`
- **Origen:** Prosa
- **Estado:** `APROBADA`

## 1. Contexto y Objetivo (El POR QUÉ)

Actualmente, el panel lateral derecho presenta el mini-calendario mensual y la sección de franjas horarias como componentes desacoplados. La agenda exhibe únicamente una ventana rígida de 8 horas anclada a la hora actual bajo el rótulo estático "Agenda Hoy", sin permitir al usuario navegar hacia horas anteriores o posteriores, ni explorar los compromisos de otros días. A su vez, los días del calendario no son interactivos y no existe sincronización entre ambos elementos.

El objetivo de esta especificación es dotar al sistema de una experiencia fluida y unificada de navegación temporal:
1. Permitir que los días del calendario sean seleccionables interactivamente, diferenciando visualmente el día actual ("hoy") del día seleccionado mediante la paleta cromática y geométrica neoplástica.
2. Hacer que la lista de horas de la agenda sea desplazable continuamente (scroll vertical) mediante un buffer móvil de 7 días, de modo que al cruzar la medianoche (00:00) hacia días anteriores o posteriores, el día seleccionado en el calendario y el título de la agenda se actualicen reactivamente.
3. Mostrar en la agenda todas las tareas correspondientes a la fecha seleccionada, apilándolas verticalmente en caso de coincidencia horaria.
4. Adaptar dinámicamente el encabezado de la agenda para reflejar la fecha en foco ("AGENDA — HOY" o "AGENDA — [DÍA] [MES]").

## 2. Actores y Usuarios

- **Usuario Final:** Persona que consulta, planifica y navega sus tareas diarias a través de la interacción combinada entre el calendario y el timeline horario.
- **Sistema de Pruebas / Verificador Automatizado:** Proceso determinista que valida el cambio de estado, la interacción por clic, el desplazamiento de scroll y la concordancia de tareas renderizadas.

## 3. Historias de Usuario

- **HU-01:** Como usuario, quiero hacer clic sobre cualquier día del calendario mensual para que dicho día quede seleccionado y la agenda se desplace inmediatamente a sus franjas horarias correspondientes (a la hora actual si es hoy, o a las 08:00 / primera tarea si es otro día).
- **HU-02:** Como usuario, quiero desplazarme verticalmente por las horas de la agenda hacia adelante o hacia atrás cruzando las 00:00 para que el calendario y el encabezado actualicen de forma automática la fecha seleccionada según la franja visible en el margen superior.
- **HU-03:** Como usuario, quiero ver claramente distinguido en el calendario cuál es el día actual ("hoy") y cuál es el día que tengo seleccionado (así como un estilo compuesto cuando ambos coinciden) para no perder mi orientación temporal.
- **HU-04:** Como usuario, quiero ver en el encabezado de la agenda la fecha que estoy explorando de forma explícita ("AGENDA — HOY" o "AGENDA — 26 OCT") para saber siempre qué día estoy revisando.
- **HU-05:** Como usuario, quiero ver en la agenda todas las tareas programadas para la fecha seleccionada ubicadas en su hora correspondiente, incluso si hay múltiples tareas en una misma hora, y poder hacer clic sobre ellas para ver su detalle en el modal de edición.

## 4. Definiciones de Dominio

- **Fecha Actual (Hoy):** Día calendario en curso determinado por la fecha del sistema del cliente.
- **Fecha Seleccionada:** Fecha activa que actúa como punto focal común entre el calendario y la agenda.
- **Buffer Deslizante de 7 Días:** Ventana móvil de franjas horarias montadas en la agenda que abarca 3 días anteriores al día seleccionado, el día seleccionado y 3 días posteriores (un total de 168 horas consecutivas).
- **Franja Focal Superior:** Franja horaria que intersecta la línea de referencia superior visible del contenedor desplazable (`scrollTop`), la cual determina de forma determinista la fecha activa del sistema.
- **Encabezado Dinámico de Agenda:** Título del panel que computa su texto según la fecha seleccionada activa: `"AGENDA — HOY"` si coincide con la fecha del sistema, o `"AGENDA — <DÍA> <MES>"` en mayúsculas si difiere.

## 5. Requisitos Funcionales (Criterios de Aceptación en EARS)

- **RF-01 (Ubiquitous):** EL SISTEMA DEBE distinguir visualmente en el calendario el día correspondiente a la fecha actual ("hoy") mediante fondo negro con texto blanco, y el día correspondiente a la fecha seleccionada mediante fondo amarillo (`#fac901`) con texto negro, cumpliendo la paleta neoplástica del proyecto.
- **RF-02 (State-Driven):** MIENTRAS la fecha seleccionada coincida con la fecha actual ("hoy"), EL SISTEMA DEBE presentar en el calendario la celda con fondo negro, texto blanco y un borde estructural amarillo (`#fac901`) de al menos 4 píxeles de grosor sin bordes redondeados.
- **RF-03 (Event-Driven):** CUANDO el usuario hace clic sobre un día dentro del calendario, EL SISTEMA DEBE establecer dicho día como la fecha seleccionada y desplazar la agenda hacia su bloque horario: si el día seleccionado es hoy, posicionando el scroll a 2 horas antes de la hora actual; si es una fecha distinta a hoy, posicionando el scroll en la primera franja que contenga tareas programadas, o en las 08:00 horas si el día no posee tareas.
- **RF-04 (Ubiquitous):** EL SISTEMA DEBE mantener en la agenda un buffer deslizante continuo de franjas horarias consecutivas que cubra 7 días (3 días anteriores, el día seleccionado y 3 días posteriores) con desplazamiento vertical libre bidireccional.
- **RF-05 (Event-Driven):** CUANDO el desplazamiento vertical de la agenda cruza la frontera de las 00:00 horas hacia una fecha diferente, tomando como criterio la franja horaria que intersecta el margen superior visible del contenedor desplazable, EL SISTEMA DEBE actualizar automáticamente la fecha seleccionada en el calendario y el título del encabezado de la agenda.
- **RF-06 (Ubiquitous):** EL SISTEMA DEBE presentar en el encabezado de la agenda el texto dinámico `"AGENDA — HOY"` cuando la fecha seleccionada coincida con la fecha actual del sistema, y el texto `"AGENDA — <DÍA> <MES>"` en mayúsculas (por ejemplo, `"AGENDA — 26 OCT"`) cuando la fecha seleccionada difiera de la fecha actual.
- **RF-07 (Ubiquitous):** EL SISTEMA DEBE presentar en las franjas horarias de la agenda todas las tareas cuya fecha y hora de vencimiento coincidan con el día y hora de cada franja, apilándolas verticalmente y expandiendo la altura de la fila sin recortar su contenido si existen dos o más tareas en la misma hora.
- **RF-08 (Event-Driven):** CUANDO el usuario hace clic sobre una tarea presentada dentro de una franja horaria de la agenda, EL SISTEMA DEBE abrir el diálogo modal de edición con los datos precargados de dicha tarea.
- **RF-09 (Unwanted Behavior):** SI una franja horaria no posee ninguna tarea asignada en la fecha correspondiente, ENTONCES EL SISTEMA DEBE renderizar la franja vacía con un indicador neutro (`--`) sin arrojar errores ni alterar la estructura de la grilla.
- **RF-10 (Event-Driven):** CUANDO la fecha seleccionada cambie a un mes diferente al mostrado actualmente en el calendario (por desplazamiento en la agenda o selección de un día visible de mes adyacente), EL SISTEMA DEBE actualizar el mes visualizado en el calendario para contener y mostrar visiblemente la fecha seleccionada.

## 6. Requisitos No Funcionales (Verificables)

- **RNF-01:** La sincronización entre el desplazamiento de scroll de la agenda y la actualización del día seleccionado en el calendario debe ejecutarse sin bloqueos en el hilo principal ni bucles de renderizado infinito, utilizando control por umbral de visibilidad o throttling en el controlador de scroll.
- **RNF-02:** Los estilos de selección, fecha actual y franjas horarias deben cumplir estrictamente los principios neoplásticos (`docs/constitution.md`): `border-radius: 0` absoluto, divisores estructurales negros o primarios gruesos (4px a 8px), cero sombras difusas y paleta cromática Mondrian estricta.
- **RNF-03:** El código del cliente debe superar la verificación de linter (`direnv exec . pnpm --filter client lint`) con exactamente 0 errores y 0 advertencias, y compilar exitosamente (`direnv exec . pnpm -r build`).

## 7. Casos Límite (Edge Cases)

- **CL-01 (Transición de fin de mes y fin de año):** Al desplazarse verticalmente cruzando las 00:00 entre el último día de un mes (o año) y el primero del siguiente (por ejemplo, del 31 de diciembre al 1 de enero), el sistema debe computar la fecha seleccionada sin desfases por huso horario (utilizando fechas locales consistentes).
- **CL-02 (Días de mes adyacente en la grilla del calendario):** Al hacer clic en un día visible del calendario perteneciente al mes anterior o posterior (días atenuados), el sistema debe seleccionar dicho día y actualizar la cabecera mensual del calendario al mes correspondiente.
- **CL-03 (Salto a fechas distantes fuera del buffer):** Cuando el usuario hace clic en una fecha situada a más de 3 días de distancia de la ventana actual montada, la agenda debe desmontar el buffer previo y recentrar la ventana deslizante de 7 días sobre la nueva fecha seleccionada, posicionando el scroll de acuerdo con la regla de `RF-03`.
- **CL-04 (Múltiples tareas completadas y pendientes en la misma franja):** Si una misma hora contiene tareas completadas y pendientes, la franja debe apilar todas las tarjetas aplicando el estilo tachado solo a las completadas y alternando la paleta cromática neoplástica cíclica de fondo.

## 8. Fuera de Alcance (Out of Scope)

- Creación de tareas directamente mediante arrastrar y soltar (drag & drop) o dibujo de bloques temporales en la agenda (la creación permanece a través del modal ya existente).
- Vistas alternativas de calendario completo (vista semanal en columnas, vista mensual extendida o vista anual).
- Sincronización o exportación a calendarios externos (Google Calendar, Microsoft Outlook, formato iCalendar).
- Modificaciones en esquemas de base de datos MongoDB o endpoints del servidor backend.

## 9. Criterios de Finalización (Definition of Done)

- Todos los requisitos funcionales (`RF-01` a `RF-10`) cuentan con verificación programática en estado `[PASA]` ejecutada mediante `.seb/bin/seb verify sincronizacion_calendario_agenda`.
- Cero violaciones a las reglas neoplásticas y arquitectónicas de `docs/constitution.md`.
- El analizador estático (`pnpm --filter client lint`) y la compilación global (`pnpm -r build`) finalizan con código de salida 0.

## 10. Dudas Abiertas y Puntos por Clarificar

Ninguna duda pendiente. Todos los requisitos y casos límite han sido definidos, clarificados y aprobados formalmente.
