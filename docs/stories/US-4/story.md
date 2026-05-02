# US-4: Gestionar expositores de un congreso

**Estado:** Ready
**Dependencia:** US-2

---

## Descripción

Como organizador autenticado, quiero poder crear, consultar, editar y eliminar los expositores de mi congreso, para administrar quiénes presentarán en el evento y generar sus links de acceso.

---

## Actor

Organizador autenticado (accede via `adminToken` del congreso — en la implementación actual: JWT del organizador).

---

## Criterios de aceptación

1. **Crear expositor:** El organizador puede crear un expositor con nombre (requerido, máx 255 caracteres), bio (texto libre, opcional), foto_url (opcional), email (opcional, con validación de formato), redes_sociales (JSONB opcional — ej: `{ "twitter": "...", "linkedin": "...", "web": "..." }`). El sistema genera automáticamente un `token_acceso` (UUID v4, único global) en el servidor.

2. **Listar expositores:** El organizador puede ver la lista de expositores de su congreso. La lista NO incluye el `token_acceso` por seguridad.

3. **Ver detalle:** El organizador puede consultar el detalle de un expositor específico. El detalle SÍ incluye el `token_acceso` (link mágico).

4. **Editar expositor:** El organizador puede modificar cualquier campo del expositor (excepto `token_acceso`, que no es editable).

5. **Eliminar expositor:** El organizador puede eliminar un expositor **solo si no tiene sesiones asignadas** (validación de US-5). En esta historia (pre-US-5) el chequeo siempre permite eliminar porque la tabla `sesiones` no existe aún.

6. **Ownership:** Todas las operaciones verifican que el congreso pertenece al organizador autenticado (JWT `sub`). Un organizador no puede operar sobre expositores de congresos ajenos (retorna 404).

7. **Scope:** Los endpoints tienen scope de congreso: `/api/dashboard/conferencias/{conferenciaId}/expositores`.

---

## Campos del expositor

| Campo | Tipo | Restricciones |
|-------|------|--------------|
| `id` | UUID | PK, generado por servidor |
| `conferencia_id` | UUID | FK → conferencias, NOT NULL |
| `nombre` | varchar(255) | NOT NULL |
| `bio` | text | nullable |
| `foto_url` | text | nullable |
| `email` | varchar(254) | nullable, validación de formato |
| `redes_sociales` | jsonb | nullable |
| `token_acceso` | varchar(36) | NOT NULL, UNIQUE global |
| `created_at` | timestamptz | NOT NULL, default NOW() |

---

## Open questions

Ninguna — historia suficientemente especificada para el TL.
