# Implementation Notes — US-4

**Date:** 2026-05-01
**Branch:** feature/US-4-gestionar-expositores

## Archivos creados/modificados

### Backend
- `backend/Models/Expositor.cs` — Id, ConferenciaId, Nombre, Bio, FotoUrl, Email, RedesSociales (JsonDocument), TokenAcceso, CreatedAt
- `backend/Data/Configurations/ExpositorConfiguration.cs` — PK UUID, FK Cascade, índice único TokenAcceso, índice (ConferenciaId)
- `backend/Data/AppDbContext.cs` — DbSet<Expositor> + CreatedAt auto-population
- `backend/DTOs/Expositores/CreateExpositorDto.cs` — Nombre (Required, MaxLength 255), Email (EmailAddress), RedesSociales (Dictionary<string,string>)
- `backend/DTOs/Expositores/UpdateExpositorDto.cs` — campos opcionales
- `backend/DTOs/Expositores/ExpositorListItemDto.cs` — sin TokenAcceso
- `backend/DTOs/Expositores/ExpositorDetalleDto.cs` — con TokenAcceso
- `backend/Services/ExpositorErrorCodes.cs` — constantes de error
- `backend/Services/IExpositorService.cs` + `ExpositorService.cs` — CRUD con ownership
- `backend/Controllers/ExpositoresController.cs` — 5 endpoints bajo [Authorize]
- `backend/Program.cs` — registro DI
- `backend/Data/Migrations/20260501000001_AddExpositor.cs` — migración manual

### Angular
- `admin/src/app/expositores/expositor.model.ts` — interfaces TypeScript
- `admin/src/app/expositores/expositor.service.ts` — HttpClient CRUD
- `admin/src/app/expositores/expositores.component.ts` — standalone OnPush, lista + form inline
- `admin/src/app/app.routes.ts` — ruta `/congreso/:id/expositores`

## Decisiones técnicas

- **RedesSociales**: almacenado como `jsonb` en PostgreSQL. DTOs usan `Dictionary<string,string>` para ergonomía. Service convierte via `JsonSerializer.SerializeToDocument` / `Deserialize`.
- **TokenAcceso**: generado en servidor como `Guid.NewGuid().ToString()`, unique global, nunca editable. NO se expone en ListItemDto, solo en Detalle.
- **Ownership**: verificado con `AnyAsync(c => c.Id == conferenciaId && c.UsuarioId == usuarioId)`. Responde 404 para no revelar existencia.
- **ServiceResult<IEnumerable>**: necesario para distinguir "congreso no existe" de "congreso sin expositores".
- **TODO US-5**: `tieneSesiones = false` hardcoded en DeleteAsync. US-5 reemplaza con query real.
- **Migración manual**: `dotnet-ef` no disponible. Creada manualmente siguiendo patrón.

## Cómo probar

```bash
cd backend && dotnet ef database update
dotnet run
```

Endpoints:
- `GET /api/dashboard/conferencias/{conferenciaId}/expositores` → lista
- `POST /api/dashboard/conferencias/{conferenciaId}/expositores` → crear (Bearer JWT)
- `PUT /api/dashboard/conferencias/{conferenciaId}/expositores/{id}` → editar
- `DELETE /api/dashboard/conferencias/{conferenciaId}/expositores/{id}` → eliminar (solo sin sesiones)

Angular: `/congreso/:id/expositores` con authGuard.

## Pendiente (US-5)
Reemplazar `tieneSesiones = false` en `ExpositorService.DeleteAsync` con query real a sesiones.
