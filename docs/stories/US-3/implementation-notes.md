# Implementation Notes — US-3

**Date:** 2026-05-01
**Branch:** feature/US-3-gestionar-salas

## Archivos creados/modificados

### Backend
- `backend/Models/Sala.cs` — entidad con Id, ConferenciaId, Nombre, Capacidad, CreatedAt
- `backend/Data/Configurations/SalaConfiguration.cs` — PK UUID, índice único (ConferenciaId, Nombre), FK Cascade
- `backend/Data/AppDbContext.cs` — DbSet<Sala> + CreatedAt auto-population
- `backend/DTOs/Salas/CreateSalaDto.cs` — Nombre (Required, MaxLength 100), Capacidad (Range 1-10000)
- `backend/DTOs/Salas/UpdateSalaDto.cs` — campos opcionales
- `backend/DTOs/Salas/SalaDto.cs` — Id, ConferenciaId, Nombre, Capacidad
- `backend/Services/SalaErrorCodes.cs` — constantes de error
- `backend/Services/ISalaService.cs` + `SalaService.cs` — CRUD con ownership
- `backend/Controllers/SalasController.cs` — 5 endpoints bajo [Authorize]
- `backend/Program.cs` — registro DI
- `backend/Data/Migrations/20260501000000_AddSala.cs` — migración manual

### Angular
- `admin/src/app/salas/sala.model.ts` — interfaces Sala, CreateSalaDto, UpdateSalaDto
- `admin/src/app/salas/sala.service.ts` — HttpClient CRUD
- `admin/src/app/salas/salas.component.ts` — standalone OnPush, lista + form inline
- `admin/src/app/app.routes.ts` — ruta `/congreso/:id/salas`

## Decisiones técnicas

- **Ownership via join**: `SalaService` verifica que `conferenciaId` pertenece al `usuarioId` JWT con `AnyAsync`. Responde 404 (no 403) para no revelar existencia.
- **Unicidad Nombre**: verificada con `AnyAsync` antes de insert/update. El índice único en BD es red de seguridad.
- **TODO US-5**: `tieneSesiones = false` hardcoded en `DeleteAsync`. US-5 debe reemplazar con query real a sesiones.
- **OnDelete Cascade**: garantiza que eliminar congreso elimina sus salas (requerido por RISK-02-04).
- **Migración manual**: `dotnet-ef` no disponible en entorno. Migración creada manualmente siguiendo patrón de `AddConferencia`.

## Cómo probar

```bash
cd backend && dotnet ef database update  # requiere PostgreSQL + appsettings.Development.json
dotnet run
```

Endpoints:
- `GET /api/dashboard/conferencias/{conferenciaId}/salas` → lista
- `POST /api/dashboard/conferencias/{conferenciaId}/salas` → crear (Bearer JWT)
- `PUT /api/dashboard/conferencias/{conferenciaId}/salas/{id}` → editar
- `DELETE /api/dashboard/conferencias/{conferenciaId}/salas/{id}` → eliminar (solo sin sesiones)

Angular: `/congreso/:id/salas` con authGuard.

## Pendiente (US-5)
Reemplazar `tieneSesiones = false` en `SalaService.DeleteAsync` con query real a sesiones.
