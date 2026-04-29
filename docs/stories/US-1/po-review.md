# PO Review — US-1: Registro y login de organizadores

**Date:** 2026-04-28  
**PO:** Product Owner  
**QA Verdict:** PASS WITH OBSERVATIONS

---

## Decision: APPROVED ✅

---

## Rationale

US-1 es la historia fundacional de autenticación y se ha implementado de manera completa y segura. El QAF verificó que todos los 8 escenarios Gherkin pasan: registro con validación, email único, verificación de email con token single-use de 24h, login con JWT de 15 min, refresh token con rotación, rechazo seguro ante credenciales inválidas (timing-safe), y acceso controlado a dashboard con guard en Angular. 

La implementación demuestra claramente las rutas principales (happy path) y los casos de error, cumpliendo exactamente con lo especificado. Las observaciones del QAF refieren a mejoras UX y limpieza técnica para fases posteriores, no a defectos en Phase 1.

---

## Accepted observations

Las siguientes observaciones del QAF se aceptan como deuda técnica para futuros sprints, sin bloquear la aprobación:

| Observación | Scope Phase 1 | Phase siguiente |
|-------------|---------------|-----------------|
| Email case-sensitivity: backend compara con igualdad estricta | Spec actual no cubre normalización | Phase 2 (UX): normalizar a minúsculas en registro/login |
| Next.js middleware header naming (`x-conference-slug`) | Sin conflicto en esta historia | Phase 2+: coordinar naming si varía en otras historias |
| Refresh token cleanup job no implementado (riesgo R-3: acumulación) | Aceptado en plan técnico como Phase 2 | Phase 2: agregar job de limpieza + índice ya está en schema |
| localStorage en lugar de httpOnly cookies | Aceptado en plan técnico como Phase 1 | Phase 2: migrar a httpOnly para seguridad mejorada |

---

## Verification table

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1: Successful registration | ✅ | `AuthService.RegistrarAsync()` persiste usuario unverified, envía email con token válido 24h |
| Scenario 2: Email confirmation activates account | ✅ | Token single-use, expiry strict, redirige a login con mensaje de éxito |
| Scenario 3: Successful login | ✅ | JWT 15 min + refresh token 7 días, Angular guarda en localStorage, authInterceptor añade header |
| Scenario 4: Login rejected — email not confirmed | ✅ | HTTP 403, mensaje explícito al usuario |
| Scenario 5: Login rejected — wrong credentials | ✅ | HTTP 401, timing-safe comparison, sin revelación de enumeración |
| Scenario 6: Registration rejected — duplicate email | ✅ | HTTP 409, mensaje claro |
| Scenario 7: Registration rejected — invalid fields | ✅ | HTTP 400, validación en DTO + Data Annotations |
| Scenario 8: Access to dashboard rejected — missing/expired JWT | ✅ | JWT middleware + Angular guard, redirige a `/login` |
| Scenario 9: Angular guard protection | ✅ | `authGuard` en rutas, signal `isAuthenticated` sincronizado |
| Scenario 10: Verification email resend | ✅ | `ReenviarVerificacionAsync()` siempre 200, safe contra user enumeration |

---

## Conditions

**None.** La historia está lista para merge a `develop` y posterior release.

---

## Handoff notes

- Backend requiere configuración de PostgreSQL y ejecución de `dotnet ef database update` en cada entorno.
- Angular Material no se instaló (plan para US-2); componentes usan HTML nativo actualmente.
- Todos los secretos (JWT key, CORS origins) se cargan desde config/environment, no hardcoded.
- QAA puede proceder con test automation: 10 escenarios listos para integración.

**Status updated: Ready → Done**  
**Approved by:** Product Owner  
**Date:** 2026-04-28
