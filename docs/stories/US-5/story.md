# US-5: Gestionar sesiones de un congreso

**Estado:** Ready
**Fecha:** 2026-05-01
**Actor:** Organizador (admin_token / JWT)
**Dependencias:** US-2 (Congreso), US-3 (Sala), US-4 (Expositor)

---

## Descripción

Como organizador, quiero poder crear, editar, consultar y eliminar sesiones de un congreso, de manera que pueda construir el programa del evento asociando expositores, salas, horarios y tracks a cada sesión.

---

## Criterios de aceptación

### CA-1: Crear sesión
- Dado que soy un organizador autenticado con un congreso existente
- Cuando envío un POST con `titulo`, `salaId`, `expositorId`, `fecha`, `horaInicio`, `horaFin` válidos
- Entonces se crea la sesión y el sistema genera automáticamente un `qrCodeUrl` para ella
- Y la respuesta incluye la sesión completa con el `qrCodeUrl` generado

### CA-2: Validación de pertenencia al congreso
- El `expositorId` enviado debe pertenecer al mismo congreso indicado en el path (`conferenciaId`)
- La `salaId` enviada debe pertenecer al mismo congreso indicado en el path (`conferenciaId`)
- Si alguna de las validaciones falla, el sistema retorna 422 con un error code descriptivo

### CA-3: Validación de fecha dentro del rango del congreso
- La `fecha` de la sesión debe estar entre `fechaInicio` y `fechaFin` del congreso (inclusive)
- Si la fecha está fuera del rango, el sistema retorna 400 con error `FECHA_FUERA_DE_RANGO`

### CA-4: Validación de rango horario
- `horaFin` debe ser estrictamente posterior a `horaInicio`
- Si no se cumple, el sistema retorna 400 con error `HORA_FIN_INVALIDA`

### CA-5: QR generado automáticamente
- Al crear o actualizar una sesión, el sistema genera el `qrCodeUrl` como URL pública:
  `{baseUrl}/api/public/{slug}/sesiones/{id}`
- El `qrCodeUrl` almacenado en la BD es la URL en texto plano (no la imagen del QR — la imagen se sirve desde el mini-sitio)
- El campo `qrCodeUrl` nunca es editable directamente por el usuario

### CA-6: Listar sesiones de un congreso
- El organizador puede obtener todas las sesiones de un congreso ordenadas por `fecha ASC`, `horaInicio ASC`
- La respuesta incluye datos del expositor (nombre) y sala (nombre) embebidos en cada sesión

### CA-7: Editar sesión
- Todos los campos son opcionales en el PUT excepto `qrCodeUrl` (que nunca se envía)
- Si se edita `salaId` o `expositorId`, se re-validan las reglas CA-2
- Si se edita `fecha`, se re-valida CA-3
- Si se editan `horaInicio` o `horaFin`, se re-valida CA-4

### CA-8: Eliminar sesión
- La eliminación es siempre permitida (no hay entidades hijas bloqueantes en este sprint)
- Retorna 204 si exitosa, 404 si la sesión no existe o no pertenece al congreso del usuario

### CA-9: Ownership multi-tenant
- El organizador solo puede ver y operar sesiones de sus propios congresos
- Toda operación sobre una sesión de un congreso ajeno retorna 404

### CA-10: CantidadSesiones actualizada en listado de congresos
- El `GET /api/dashboard/conferencias` (US-2) debe retornar el COUNT real de sesiones
- Actualmente devuelve `0` hardcodeado — US-5 debe reemplazarlo por la subquery real contra la tabla `sesiones`

---

## Campos de la entidad Sesion

| Campo | Tipo | Requerido | Notas |
|-------|------|-----------|-------|
| `id` | UUID | auto | PK |
| `conferenciaId` | UUID | si | FK → conferencias |
| `salaId` | UUID | si | FK → salas |
| `expositorId` | UUID | si | FK → expositores |
| `titulo` | string | si | max 500 chars |
| `descripcion` | string? | no | texto libre |
| `fecha` | DateOnly | si | debe estar en rango del congreso |
| `horaInicio` | TimeOnly | si | hora de inicio |
| `horaFin` | TimeOnly | si | debe ser > horaInicio |
| `track` | string? | no | max 100 chars |
| `encuestaUrl` | string? | no | URL externa, campo libre |
| `qrCodeUrl` | string? | auto | generado al crear/editar, nunca editado por usuario |
| `createdAt` | DateTime | auto | UTC |

---

## Reglas de negocio

- **Solapamientos de horario**: no se validan en este sprint (fuera de alcance). El organizador es responsable de no crear conflictos de sala/horario.
- **encuestaUrl**: campo libre de texto. El sistema no valida que sea una URL válida ni que el formulario exista. Es un link externo que el organizador proporciona.
- **qrCodeUrl**: contiene la URL pública de la sesión en el mini-sitio. El QR visual se genera en el cliente (mini-sitio Next.js) a partir de esta URL. El backend solo almacena la URL en texto plano.

---

## Preguntas resueltas

- **Q: ¿Se validan solapamientos de sala/hora?** R: No en este sprint.
- **Q: ¿encuestaUrl requiere validación de formato URL?** R: No. Campo libre, la responsabilidad es del organizador.
- **Q: ¿El QR es la imagen o la URL?** R: Solo se almacena la URL. La imagen QR la genera el mini-sitio (Next.js) en el cliente.
