---
name: US-2 technical decisions
description: Decisiones técnicas clave tomadas en el plan de US-2 que impactan historias futuras
type: project
---

El plan técnico de US-2 (2026-04-28) establece las siguientes decisiones que afectan US-3 a US-5:

**Cascade delete:** Toda entidad hija de `Conferencia` (salas, expositores, sesiones) DEBE declarar `OnDelete(DeleteBehavior.Cascade)` en su `IEntityTypeConfiguration`. Si no lo hace, el DELETE de una conferencia con hijos fallará con FK violation. Este requisito está documentado en RT-2-04.

**Why:** La eliminación en cascada de congresos en borrador (resuelta por PO 2026-04-28) se instrumenta via FK `ON DELETE CASCADE` en la BD, no en lógica de aplicación.

**How to apply:** Al producir el plan técnico de US-3, US-4 y US-5, verificar que la `IEntityTypeConfiguration` de cada entidad hija incluye `OnDelete(DeleteBehavior.Cascade)` en la FK hacia `conferencias`.

---

**CantidadSesiones en listado:** El DTO `ConferenciaListItemDto` ya existe con `CantidadSesiones = 0` (literal). En US-5, cuando se cree la tabla `sesiones`, el DEV de US-5 debe reemplazar el literal por la subquery COUNT real en `ConferenciaService.GetMisConferenciasAsync`. Sin breaking change de contrato.

**Why:** La tabla `sesiones` no existe en US-2; se evita una referencia a modelo inexistente.

**How to apply:** En el plan de US-5, agregar tarea explícita para actualizar la query de listado de congresos.

---

**US-4 — Validación sesiones al eliminar expositor (RT-4-03):** `ExpositorService.DeleteAsync` incluye un TODO explícito para que US-5 agregue la validación "no eliminar si tiene sesiones asignadas". US-5 DEBE: (1) agregar la verificación en `DeleteAsync`, (2) retornar `Fail("TIENE_SESIONES_ASIGNADAS")` → controller responde 422. Registrado en risk-register como RT-4-03.

**Why:** La tabla `sesiones` no existe en US-4; la validación no puede implementarse hasta US-5.

**How to apply:** En el plan de US-5, agregar tarea explícita para completar la validación en `ExpositorService.DeleteAsync`.
