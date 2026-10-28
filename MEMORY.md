# MEMORY.md — Bitácora Técnica y Restricciones (seb-harness)

> **Regla de Higiene de Contexto:** Este archivo almacena lo aprendido empíricamente en el proyecto entre sesiones.
> - **Límite duro:** Máximo 150 líneas (~15 KB). Resume o elimina entradas obsoletas.
> - **Promoción:** Si un aprendizaje se vuelve una ley permanente de arquitectura, muévelo a `docs/constitution.md`.
> - **Seguridad:** Prohibido guardar credenciales, tokens, rutas privadas del host o datos personales.
> - **Invariante del Agente:** Antes de proponer un diseño en `seb-planificador` o escribir código, verifica las secciones 2 y 3 para no reintentar enfoques fallidos.

## 1. Estado Actual del Proyecto
- **Fase SDD activa:** Fase 5 completada para Spec 003 (`003_sincronizacion_calendario_agenda`).
- **Última Spec verificada:** `003_sincronizacion_calendario_agenda`.
- **Estado de la suite de verificación:** Build global funcional (`direnv exec . pnpm -r build`). 11 tests E2E Playwright aprobados al 100%, 5/5 controles deterministas de spec 003 en `[PASA]`.

## 2. Callejones sin Salida y Enfoques Descartados (NO REINTENTAR)
- *Formato: `[Fecha] [Tarea/Spec] Qué se intentó -> Por qué falló -> Alternativa adoptada`*
- `[2026-10-23] [Iniciador] Invocación directa de pnpm sin devShell en NixOS -> Falla con comando no encontrado (PATH no heredado en subshell plano) -> Usar siempre 'direnv exec . pnpm ...'`
- `[2026-10-26] [Spec 003] Recentrar buffer de días dinámicamente con cada cambio de día en scroll -> Desplaza 24h de altura del DOM bajo el scrollbar provocando bucle infinito de eventos onScroll -> Anclar ventana de 7 días con bufferAnchorDate y recentrar solo al superar ±3 días`

## 3. Restricciones Técnicas y Trampas Conocidas (Gotchas)
- *Formato: `[Componente] Restricción detectada -> Impacto en tests o compilación`*
- `[NixOS / Shell] Herramientas globales (node, pnpm, playwright) residen en el flake devShell -> Comandos automáticos y de verificación deben prefijarse con 'direnv exec .'`
- `[React 19 / ESLint] Regla react-hooks/set-state-in-effect activa en eslint v9 -> TaskModal.tsx tiene llamadas síncronas a setState dentro de useEffect que disparan error de linter`
- `[Playwright / Reporter] Reporter 'html' por defecto abre navegador de forma interactiva y bloqueante -> Configurar con { open: 'never' } para ejecuciones no interactivas deterministas`
- `[Vitest / Monorepo CJS] Configuración de Vitest en workspaces CJS requiere extensión .mts (vitest.config.mts) para evitar advertencias de incompatibilidad nativa ESM/CJS en Vite.`
- `[DOM / Scroll Listener] offsetTop depende de offsetParent no garantizado en contenedores anidados -> Detección inexacta de franja focal -> Usar getBoundingClientRect() relativo al contenedor`

## 4. Riesgos Conocidos y Deuda Técnica Activa
- *Formato: `[ID-Spec] Descripción del riesgo -> Condición de mitigación`*
- `[DEBT-01] Ausencia de tests en workspace server -> Instalar y configurar vitest en server en la primera spec funcional`
- `[DEBT-02] Mock de autenticación Hodor en auth.ts -> Validar tokens reales una vez formalizado el contrato del IdP externo`

## 5. Decisiones Técnicas Relevantes (Histórico Reciente)
- *Formato: `[D-XX] Decisión tomada -> Alternativa descartada -> Motivo`*
- `[D-01] Adopción de vitest para backend -> Jest / node:test puro -> Compatibilidad con TypeScript moderno, velocidad y sintaxis homogénea`
- `[D-02] Estandarización de 'direnv exec . pnpm ...' -> Scripts en PATH global -> Garantiza reproducibilidad determinista en NixOS`
- `[D-03] Mantener mock de identidad Hodor en Fase 0 -> Implementación prematura de auth -> Foco en el core de gestión de tareas y UI Mondrian`
- `[D-04] Buffer móvil de 7 días con anclaje de ±3 días -> Librerías externas de virtualización -> Cumple prohibición constitucional de dependencias y garantiza 60fps sin desfases de scroll`
- **[2026-10-27] [decision]** [Spec 005] Unicidad global de categorias garantizada con campo sombra nameKey (nombre trim + minusculas) e indice unique en Mongoose, con mapeo de E11000 a DomainError -> 409 en el controlador. Descartado: solo verificacion previa en servicio (deja CL-08 abierto) y collation strength 2 (semantica de acentos implicita y no testeable con mocks de vitest)
- **[2026-10-27] [riesgo]** [Spec 005] RF-05 exige 409 Conflict pero constitution.md Seccion E solo enumera 400/404/500. Interpretacion registrada: 409 es codigo HTTP estandar para conflicto de unicidad, no para fallo de formato. Si la Seccion E se lee como lista exhaustiva, la spec 005 debe volver a seb-clarificador antes de implementar
- **[2026-10-27] [harness]** El binario seb (VERSION 01a0024-dirty) omite silenciosamente las filas del verificador cuyo campo Requisito no empieza con 'RF-': su regex de parseo es ^\| (CHK-...)\| (RF-...)\|... Por eso 'seb verify categorias' reporta 12/12 APROBADO omitiendo CHK-09 (RNF-02), CHK-98 (RNF-01,RNF-02) y CHK-99 (GLOBAL). Los 3 controles se ejecutaron manualmente y pasan. Riesgo: el veredicto APROBADO no cubre el 100% exigido en el criterio de aprobacion del verificador. No se pudo corregir el binario (binario precompilado sin fuente en el repo) ni el verificador (sellado por plan-lock e inmutable para el implementador).
