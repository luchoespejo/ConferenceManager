# US-10: Plan Técnico — Gestión de Participantes

**Estado**: Ready for DEV  
**TL**: Claude

---

## Cambios requeridos

### 1. Backend

#### Model
- **File**: `Models/Participante.cs` (NEW)
- **Fields**: Id (UUID), ConferenciaId (FK), Nombre, Email, PuedeGenerarCertificado (bool), CreatedAt
- **EF Config**: Composite index `(ConferenciaId, Email)` con IsUnique

#### DTOs
- **CreateParticipanteDto**: Nombre, Email
- **UpdateParticipanteDto**: Nombre?, Email?, PuedeGenerarCertificado?
- **ParticipanteDto**: Id, ConferenciaId, Nombre, Email, PuedeGenerarCertificado, CreatedAt

#### Service
- **IParticipanteService**: GetAllAsync, GetByIdAsync, CreateAsync, UpdateAsync, DeleteAsync
- **ParticipanteService**: implementación con validaciones
  - Email único por conferencia
  - Ownership check (UsuarioId)
  - Soft-delete: NO (hard delete OK)

#### Controller
- **File**: `Controllers/ParticipantesController.cs` (NEW)
- **Route**: `/api/dashboard/conferencias/{conferenciaId}/participantes`
- **Actions**: GET, GET/{id}, POST, PUT/{id}, DELETE/{id}

#### Migration
- Add `participantes` table con columnas
- Create index `IX_Participantes_ConferenciaId_Email` (unique)

#### Program.cs
- Register: `builder.Services.AddScoped<IParticipanteService, ParticipanteService>();`

### 2. Frontend (Angular)

#### Component
- **File**: `admin/src/app/congreso/participantes/...` (NEW)
- **Routes**: `/congreso/:id/participantes`
- **Layout**: List + embedded form (create/edit)

#### List
- Table: Nombre, Email, Certificado (toggle), Actions (edit, delete)
- Paginación: opcional (start simple: all at once)
- Sort: por nombre

#### Create/Edit Form
- Modal o inline form
- Fields: Nombre (required), Email (required, email format, unique check)
- Toggle: Puede generar certificado (disabled for readonly)
- Submit: Save, Cancel

#### Delete
- Confirmation dialog: "¿Eliminar {nombre}?"
- Hide on success

---

## Estimación

| Tarea | Tiempo |
|-------|--------|
| Backend model + migration | 20 min |
| Service + controller | 30 min |
| Frontend list component | 30 min |
| Frontend forms | 30 min |
| Testing | 20 min |
| **Total** | **~2.5h** |

---

## Riesgos

| Riesgo | Mitigación |
|--------|-----------|
| Email uniqueness index conflict | Test with duplicate emails |
| Angular form validation | Use reactive forms + custom validators |
| Ownership leaks | All endpoints check `usuarioId` |

---

## Criterios de aceptación técnicos

- [x] Participante model creado (UUID PK, FK ConferenciaId)
- [x] Email único por conferencia (composite index)
- [x] Service + controller con ownership checks
- [x] Angular list + CRUD forms
- [x] No regresiones en features existentes

---

*Escrito: 2026-05-02 — TL*
