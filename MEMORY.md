# MEMORY.md — Bitácora Técnica y Restricciones (seb-harness)

> **Regla de Higiene de Contexto:** Este archivo almacena lo aprendido empíricamente en el proyecto entre sesiones.
> - **Límite duro:** Máximo 150 líneas (~15 KB). Resume o elimina entradas obsoletas.
> - **Promoción:** Si un aprendizaje se vuelve una ley permanente de arquitectura, muévelo a `docs/constitution.md`.
> - **Seguridad:** Prohibido guardar credenciales, tokens, rutas privadas del host o datos personales.
> - **Invariante del Agente:** Antes de proponer un diseño en `seb-planificador` o escribir código, verifica las secciones 2 y 3 para no reintentar enfoques fallidos.

## 1. Estado Actual del Proyecto
- **Fase SDD activa:** Fase 0 completada (`docs/constitution.md` generada y ratificada). Listo para Fase 1 (`seb-especificador`).
- **Última Spec verificada:** Ninguna.
- **Estado de la suite de verificación:** Build funcional (`direnv exec . pnpm -r build`). Linter reporta 5 errores previos en `client`. Backend pendiente de suite `vitest`.

## 2. Callejones sin Salida y Enfoques Descartados (NO REINTENTAR)
- *Formato: `[Fecha] [Tarea/Spec] Qué se intentó -> Por qué falló -> Alternativa adoptada`*
- `[2026-10-23] [Iniciador] Invocación directa de pnpm sin devShell en NixOS -> Falla con comando no encontrado (PATH no heredado en subshell plano) -> Usar siempre 'direnv exec . pnpm ...'`

## 3. Restricciones Técnicas y Trampas Conocidas (Gotchas)
- *Formato: `[Componente] Restricción detectada -> Impacto en tests o compilación`*
- `[NixOS / Shell] Herramientas globales (node, pnpm, playwright) residen en el flake devShell -> Comandos automáticos y de verificación deben prefijarse con 'direnv exec .'`
- `[React 19 / ESLint] Regla react-hooks/set-state-in-effect activa en eslint v9 -> TaskModal.tsx tiene llamadas síncronas a setState dentro de useEffect que disparan error de linter`
- `[Playwright / Reporter] Reporter 'html' por defecto abre navegador de forma interactiva y bloqueante -> Configurar con { open: 'never' } para ejecuciones no interactivas deterministas`

## 4. Riesgos Conocidos y Deuda Técnica Activa
- *Formato: `[ID-Spec] Descripción del riesgo -> Condición de mitigación`*
- `[DEBT-01] Ausencia de tests en workspace server -> Instalar y configurar vitest en server en la primera spec funcional`
- `[DEBT-02] Mock de autenticación Hodor en auth.ts -> Validar tokens reales una vez formalizado el contrato del IdP externo`

## 5. Decisiones Técnicas Relevantes (Histórico Reciente)
- *Formato: `[D-XX] Decisión tomada -> Alternativa descartada -> Motivo`*
- `[D-01] Adopción de vitest para backend -> Jest / node:test puro -> Compatibilidad con TypeScript moderno, velocidad y sintaxis homogénea`
- `[D-02] Estandarización de 'direnv exec . pnpm ...' -> Scripts en PATH global -> Garantiza reproducibilidad determinista en NixOS`
- `[D-03] Mantener mock de identidad Hodor en Fase 0 -> Implementación prematura de auth -> Foco en el core de gestión de tareas y UI Mondrian`
