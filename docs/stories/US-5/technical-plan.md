# Technical Plan — US-5: Gestionar sesiones de un congreso

**Fecha:** 2026-05-01
**Autor:** Technical Lead
**Story:** [US-5](./story.md)
**Estado:** Aprobado

---

## 1. Resumen de análisis

US-5 introduce la entidad `Sesion`, el tercer hijo directo de `Conferencia` y la más compleja del dominio hasta ahora: referencia tanto a `Sala` como a `Expositor`, impone validaciones cross-entidad (ambos deben pertenecer al mismo congreso), valida la fecha contra el rango del congreso, y genera un `qrCodeUrl` automático al crear. No se usa la librería QRCoder (.NET) porque el campo almacenado es únicamente la URL en texto plano — la imagen QR la genera el mini-sitio (Next.js) en cliente. Esto elimina la necesidad de incorporar un paquete nuevo al backend en este sprint.

El patrón de implementación es idéntico al de US-3 y US-4: modelo EF Core con Fluent API, `ServiceResult<T>`, controller `[Authorize]` con rutas anidadas bajo `conferencias/{conferenciaId}`, y servicio Angular standalone con signals. Adicionalmente, US-5 debe cerrar dos TODOs abiertos desde sprints anteriores: (1) reemplazar el `CantidadSesiones = 0` hardcodeado en `ConferenciaService.GetMisConferenciasAsync`, y (2) activar las validaciones de "tiene sesiones" en `SalaService.DeleteAsync` y `ExpositorService.DeleteAsync`.

---

## 2. Análisis de impacto

### Archivos y módulos afectados

| Archivo / Módulo | Tipo de cambio | Razón |
|-----------------|---------------|-------|
| `backend/Models/Sesion.cs` | Creación | Entidad de dominio nueva |
| `backend/Data/Configurations/SesionConfiguration.cs` | Creación | Fluent API: FK, índices, tipos de columna |
| `backend/Data/AppDbContext.cs` | Modificación | Agregar `DbSet<Sesion>` y bloque `CreatedAt` en `SaveChangesAsync` |
| `backend/DTOs/Sesiones/CreateSesionDto.cs` | Creación | DTO de entrada para POST |
| `backend/DTOs/Sesiones/UpdateSesionDto.cs` | Creación | DTO de entrada para PUT |
| `backend/DTOs/Sesiones/SesionDto.cs` | Creación | DTO de salida (lista y detalle) |
| `backend/Services/SesionErrorCodes.cs` | Creación | Constantes de error code del dominio |
| `backend/Services/ISesionService.cs` | Creación | Interfaz del servicio |
| `backend/Services/SesionService.cs` | Creación | Implementación CRUD con validaciones cross-entidad |
| `backend/Controllers/SesionesController.cs` | Creación | Endpoints bajo `/api/dashboard/conferencias/{conferenciaId}/sesiones` |
| `backend/Data/Migrations/{timestamp}_AddSesion.cs` | Creación | Migración EF Core (generada por CLI) |
| `backend/Program.cs` | Modificación | Registrar `ISesionService` en DI |
| `backend/Services/ConferenciaService.cs` | Modificación | Reemplazar `CantidadSesiones = 0` por subquery real |
| `backend/Services/SalaService.cs` | Modificación | Activar validación `tieneSesiones` en `DeleteAsync` (TODO US-5) |
| `backend/Services/ExpositorService.cs` | Modificación | Activar validación `tieneSesiones` en `DeleteAsync` (TODO US-5) |
| `admin/src/app/sesiones/sesion.model.ts` | Creación | Interfaces TypeScript de DTOs |
| `admin/src/app/sesiones/sesion.service.ts` | Creación | Servicio HTTP Angular |
| `admin/src/app/sesiones/sesiones.component.ts` | Creación | Componente lista + form inline |
| `admin/src/app/app.routes.ts` | Modificación | Agregar ruta `/congreso/:id/sesiones` bajo `authGuard` |

### Impacto en otros módulos (regresión potencial)

| Módulo | Riesgo de regresión | Mitigación |
|--------|--------------------|-----------| 
| `AppDbContext` | Bajo — se agrega `DbSet<Sesion>` y bloque `CreatedAt`; no se toca lógica existente | QAA verifica que el snapshot de migración no rompe migraciones anteriores (`AddConferencia`, `AddSala`, `AddExpositor`) |
| `ConferenciaService.GetMisConferenciasAsync` | Medio — se reemplaza el literal `0` por una subquery EF Core. Si la subquery es incorrecta puede provocar N+1 o resultados incorrectos | El DEV debe usar proyección LINQ con subquery correlacionada: `CantidadSesiones = context.Sesiones.Count(s => s.ConferenciaId == c.Id)`. EF Core 8 genera un `SELECT COUNT(*)` correlacionado eficiente. QAA verifica con datos de prueba. |
| `SalaService.DeleteAsync` | Bajo — se activa el TODO US-5. La lógica ya existe en estructura; solo se reemplaza `false` por la query real | QAA prueba que DELETE de sala con sesiones retorna 422 |
| `ExpositorService.DeleteAsync` | Bajo — mismo patrón que `SalaService.DeleteAsync` | QAA prueba que DELETE de expositor con sesiones retorna 422 |
| `admin/app.routes.ts` | Bajo — se agrega ruta nueva; wildcard y rutas existentes permanecen | QAA verifica que dashboard, login y rutas de congreso existentes siguen funcionando |

### Impacto arquitectónico

- [x] **No** — la implementación es interna al módulo de sesiones. El patrón de entidad hija de Conferencia, FK con cascade delete, y endpoints de dashboard ya están establecidos. El `qrCodeUrl` es un campo de texto plano (URL), no se genera imagen binaria en el backend — no se requiere paquete nuevo ni integración externa. No se introduce ningún nuevo contenedor C4.

---

## 3. Preguntas funcionales detectadas

Ninguna — la story especifica los campos, validaciones cross-entidad, comportamiento del `qrCodeUrl` (URL en texto plano, no imagen), el campo `encuestaUrl` como libre sin validación de formato, y el out-of-scope de solapamientos de horario.

> Estado: Sin preguntas pendientes.

---

## 4. Plan de trabajo

### Enfoque técnico

La implementación sigue el patrón establecido en US-3 y US-4 con las siguientes particularidades:

- **Modelo**: clase POCO `Sesion` con `DateOnly Fecha`, `TimeOnly HoraInicio`, `TimeOnly HoraFin`. EF Core 8 + Npgsql 10 mapean `DateOnly` ↔ `date` y `TimeOnly` ↔ `time` de forma nativa — patrón ya validado en `Conferencia.cs` con `DateOnly`.
- **FK doble**: `SalaId` → `salas(id)` y `ExpositorId` → `expositores(id)`. Ambas con `OnDelete(DeleteBehavior.Restrict)` — si se elimina una sala o expositor con sesiones, la BD rechaza el DELETE con FK violation. Esto se combina con las validaciones en `SalaService.DeleteAsync` y `ExpositorService.DeleteAsync` (activadas en este sprint) que devuelven 422 antes de llegar a la BD.
- **Validaciones cross-entidad en el servicio**: antes de crear o actualizar, verificar que `salaId` pertenece al congreso (`context.Salas.AnyAsync(s => s.Id == dto.SalaId && s.ConferenciaId == conferenciaId)`) y que `expositorId` pertenece al congreso (`context.Expositores.AnyAsync(e => e.Id == dto.ExpositorId && e.ConferenciaId == conferenciaId)`). Ambas con `AsNoTracking()`.
- **Validación de fecha**: comparar `dto.Fecha` contra `conferencia.FechaInicio` y `conferencia.FechaFin`. La conferencia se recupera una sola vez al inicio del método con `AsNoTracking()` para reutilizar también en la validación de ownership.
- **qrCodeUrl**: se construye en el servicio al crear como `$"{baseUrl}/api/public/{slug}/sesiones/{id}"`. El `baseUrl` y `slug` se obtienen: `baseUrl` desde `IConfiguration["App:BaseUrl"]` (a agregar en `appsettings.json` si no existe) y `slug` desde la conferencia ya recuperada para ownership. El `id` de la sesión se genera antes de persistir (`sesion.Id = Guid.NewGuid()` asignado explícitamente para poder construir la URL antes de `SaveChangesAsync`). Al actualizar, si cambia `salaId` o `expositorId` el `qrCodeUrl` no se regenera — permanece estático. Si el requisito futuro cambia, se ajusta en otro sprint.
- **Índice**: `(ConferenciaId, Fecha, HoraInicio)` — cubre la query de listado ordenada.
- **Cierre de TODOs**: `ConferenciaService` reemplaza literal `0`; `SalaService.DeleteAsync` y `ExpositorService.DeleteAsync` activan el `AnyAsync` real.

### Tareas de implementación

> Las ramas siguen el patrón `feature/US-{N}-{short-title}` definido en `.claude/settings.json`. El DEV opera en rama `feature/US-5-gestionar-sesiones` creada desde `main`. Como `pipeline.devPlanReview` es `false`, el DEV implementa directamente.

#### Backend

- [ ] **Tarea 1: Modelo `Sesion`**
  - Archivo: `backend/Models/Sesion.cs`
  - Notas: Propiedades: `Guid Id`, `Guid ConferenciaId`, `Guid SalaId`, `Guid ExpositorId`, `string Titulo`, `string? Descripcion`, `DateOnly Fecha`, `TimeOnly HoraInicio`, `TimeOnly HoraFin`, `string? Track`, `string? EncuestaUrl`, `string? QrCodeUrl`, `DateTime CreatedAt`. Propiedades de navegación: `Conferencia Conferencia`, `Sala Sala`, `Expositor Expositor`. NO agregar `ICollection<Sesion>` en ninguno de los modelos padre — las FK se declaran solo en `SesionConfiguration`.

- [ ] **Tarea 2: `SesionConfiguration` (Fluent API)**
  - Archivo: `backend/Data/Configurations/SesionConfiguration.cs`
  - Notas:
    - Tabla: `"sesiones"`
    - PK: `HasDefaultValueSql("gen_random_uuid()")`
    - `Titulo`: `IsRequired()`, `HasMaxLength(500)`
    - `Descripcion`: `HasColumnType("text")`
    - `Fecha`: `HasColumnType("date")`, `IsRequired()`
    - `HoraInicio`: `HasColumnType("time")`, `IsRequired()`
    - `HoraFin`: `HasColumnType("time")`, `IsRequired()`
    - `Track`: `HasMaxLength(100)`
    - `EncuestaUrl`: `HasColumnType("text")`
    - `QrCodeUrl`: `HasColumnType("text")`
    - `CreatedAt`: `HasColumnType("timestamptz")`, `HasDefaultValueSql("NOW()")`, `ValueGeneratedOnAdd()`
    - FK `ConferenciaId`: `HasOne(s => s.Conferencia).WithMany().HasForeignKey(s => s.ConferenciaId).OnDelete(DeleteBehavior.Cascade)`
    - FK `SalaId`: `HasOne(s => s.Sala).WithMany().HasForeignKey(s => s.SalaId).OnDelete(DeleteBehavior.Restrict)`
    - FK `ExpositorId`: `HasOne(s => s.Expositor).WithMany().HasForeignKey(s => s.ExpositorId).OnDelete(DeleteBehavior.Restrict)`
    - Índice compuesto: `HasIndex(s => new { s.ConferenciaId, s.Fecha, s.HoraInicio })` (para ordenación del listado)

- [ ] **Tarea 3: Actualizar `AppDbContext`**
  - Archivo: `backend/Data/AppDbContext.cs`
  - Notas: Agregar `public DbSet<Sesion> Sesiones => Set<Sesion>();`. Agregar bloque en `SaveChangesAsync` para poblar `CreatedAt` en entradas `Sesion` con estado `Added`, idéntico a los bloques existentes.

- [ ] **Tarea 4: DTOs de Sesion**
  - Archivos: `backend/DTOs/Sesiones/CreateSesionDto.cs`, `UpdateSesionDto.cs`, `SesionDto.cs`
  - Notas:
    - `CreateSesionDto`: `string Titulo` (required, `[MaxLength(500)]`), `Guid SalaId` (required), `Guid ExpositorId` (required), `DateOnly Fecha` (required), `TimeOnly HoraInicio` (required), `TimeOnly HoraFin` (required), `string? Track` (`[MaxLength(100)]`), `string? Descripcion`, `string? EncuestaUrl`. **Sin** `QrCodeUrl` — nunca enviado por el cliente.
    - `UpdateSesionDto`: todos los campos de `CreateSesionDto` como nullable (`string? Titulo`, `Guid? SalaId`, etc.). **Sin** `QrCodeUrl`.
    - `SesionDto`: `Guid Id`, `Guid ConferenciaId`, `Guid SalaId`, `string SalaNombre`, `Guid ExpositorId`, `string ExpositorNombre`, `string Titulo`, `string? Descripcion`, `DateOnly Fecha`, `TimeOnly HoraInicio`, `TimeOnly HoraFin`, `string? Track`, `string? EncuestaUrl`, `string? QrCodeUrl`, `DateTime CreadoEn`. Los campos `SalaNombre` y `ExpositorNombre` se populan en la proyección LINQ.

- [ ] **Tarea 5: `SesionErrorCodes` e `ISesionService`**
  - Archivos: `backend/Services/SesionErrorCodes.cs`, `backend/Services/ISesionService.cs`
  - Notas — error codes:
    - `ConferenciaNotFound` — congreso no existe o no pertenece al usuario
    - `SesionNotFound` — sesión no encontrada
    - `SalaNotFound` — sala no existe en este congreso (cross-entidad)
    - `ExpositorNotFound` — expositor no existe en este congreso (cross-entidad)
    - `FechaFueraDeRango` — fecha no está entre fechaInicio y fechaFin del congreso
    - `HoraFinInvalida` — horaFin <= horaInicio
  - Interfaz:
    ```
    Task<ServiceResult<IEnumerable<SesionDto>>> GetByConferenciaAsync(Guid conferenciaId, Guid usuarioId);
    Task<ServiceResult<SesionDto>> GetByIdAsync(Guid id, Guid conferenciaId, Guid usuarioId);
    Task<ServiceResult<SesionDto>> CreateAsync(CreateSesionDto dto, Guid conferenciaId, Guid usuarioId);
    Task<ServiceResult<SesionDto>> UpdateAsync(Guid id, UpdateSesionDto dto, Guid conferenciaId, Guid usuarioId);
    Task<ServiceResult> DeleteAsync(Guid id, Guid conferenciaId, Guid usuarioId);
    ```

- [ ] **Tarea 6: `SesionService`**
  - Archivo: `backend/Services/SesionService.cs`
  - Notas detalladas:
    - Inyectar `AppDbContext context` e `IConfiguration configuration` (para `App:BaseUrl`).
    - Helper privado `GetConferenciaOrFailAsync(Guid conferenciaId, Guid usuarioId)`: retorna `Conferencia?` (con `AsNoTracking()`). Si null → el llamador retorna `Fail(ConferenciaNotFound)`. Reutilizado en todos los métodos — la conferencia es necesaria para validar fecha y construir `qrCodeUrl`.
    - `GetByConferenciaAsync`: (1) verificar ownership via `GetConferenciaOrFailAsync`; (2) query con `AsNoTracking()`:
      ```csharp
      context.Sesiones
        .AsNoTracking()
        .Where(s => s.ConferenciaId == conferenciaId)
        .Include(s => s.Sala)
        .Include(s => s.Expositor)
        .OrderBy(s => s.Fecha).ThenBy(s => s.HoraInicio)
        .Select(s => new SesionDto { ..., SalaNombre = s.Sala.Nombre, ExpositorNombre = s.Expositor.Nombre })
      ```
      Alternativa sin `Include`: usar proyección LINQ directa con navigation property en el `Select` — EF Core generará JOINs automáticamente.
    - `GetByIdAsync`: verificar ownership → `FirstOrDefaultAsync(s => s.Id == id && s.ConferenciaId == conferenciaId)` con proyección. Retorna `Fail(SesionNotFound)` si null (no `null` — para que el controller pueda distinguir "congreso no existe" de "sesión no existe" y retornar 404 en ambos casos con mensajes distintos en logs).
    - `CreateAsync`:
      1. Obtener conferencia con `GetConferenciaOrFailAsync` — si null, `Fail(ConferenciaNotFound)`.
      2. Validar `dto.HoraFin > dto.HoraInicio` — si no, `Fail(SesionErrorCodes.HoraFinInvalida)`.
      3. Validar `dto.Fecha >= conferencia.FechaInicio && dto.Fecha <= conferencia.FechaFin` — si no, `Fail(SesionErrorCodes.FechaFueraDeRango)`.
      4. Validar sala: `context.Salas.AsNoTracking().AnyAsync(s => s.Id == dto.SalaId && s.ConferenciaId == conferenciaId)` — si false, `Fail(SesionErrorCodes.SalaNotFound)`.
      5. Validar expositor: `context.Expositores.AsNoTracking().AnyAsync(e => e.Id == dto.ExpositorId && e.ConferenciaId == conferenciaId)` — si false, `Fail(SesionErrorCodes.ExpositorNotFound)`.
      6. Generar `id = Guid.NewGuid()`.
      7. Construir `qrCodeUrl = $"{configuration["App:BaseUrl"]}/api/public/{conferencia.Slug}/sesiones/{id}"`.
      8. Crear y persistir (`context.Sesiones.Add(sesion)`, `SaveChangesAsync`).
      9. Retornar `Ok(MapToDto(sesion, conferencia.Slug))`. La sala y expositor para el DTO se recuperan de las propiedades ya validadas o con queries adicionales — preferir proyección en la query de retorno para evitar tracking.
    - `UpdateAsync`:
      1. Obtener conferencia con `GetConferenciaOrFailAsync`.
      2. Obtener sesión con tracking: `FirstOrDefaultAsync(s => s.Id == id && s.ConferenciaId == conferenciaId)` — si null, `Fail(SesionNotFound)`.
      3. Si `dto.HoraInicio` o `dto.HoraFin` cambian: recalcular y validar `horaFin > horaInicio` usando los valores efectivos (los nuevos si vienen en el dto, los existentes si no).
      4. Si `dto.Fecha` cambia: validar contra rango del congreso.
      5. Si `dto.SalaId` cambia: validar cross-entidad.
      6. Si `dto.ExpositorId` cambia: validar cross-entidad.
      7. Aplicar cambios y `SaveChangesAsync`. **No regenerar `QrCodeUrl`** al editar.
    - `DeleteAsync`: (1) verificar ownership; (2) obtener sesión con tracking; (3) `context.Sesiones.Remove(sesion)` + `SaveChangesAsync`. No hay entidades hijas bloqueantes en este sprint.

- [ ] **Tarea 7: `SesionesController`**
  - Archivo: `backend/Controllers/SesionesController.cs`
  - Notas:
    - `[ApiController]`, `[Authorize]`, `[Route("api/dashboard/conferencias/{conferenciaId:guid}/sesiones")]`
    - Helper: `Guid UsuarioId => Guid.Parse(User.FindFirstValue(JwtRegisteredClaimNames.Sub)!);`
    - `GET /` → `GetByConferenciaAsync` → 200 o 404 (`ConferenciaNotFound`).
    - `POST /` → `CreateAsync` → 201 con `SesionDto`. Errores: `ConferenciaNotFound` → 404; `SalaNotFound` / `ExpositorNotFound` → 422; `FechaFueraDeRango` / `HoraFinInvalida` → 400.
    - `GET /{id:guid}` → `GetByIdAsync` → 200 o 404.
    - `PUT /{id:guid}` → `UpdateAsync` → 200 o 404 (`ConferenciaNotFound`/`SesionNotFound`) o 422 (`SalaNotFound`/`ExpositorNotFound`) o 400 (`FechaFueraDeRango`/`HoraFinInvalida`).
    - `DELETE /{id:guid}` → `DeleteAsync` → 204 o 404.
    - Para 422: `StatusCode(422, new { error = result.ErrorCode, message = result.ErrorMessage })`.
    - POST retorna `CreatedAtAction(nameof(GetSesion), new { conferenciaId, id = result.Data!.Id }, result.Data)`.

- [ ] **Tarea 8: Registro DI en `Program.cs`**
  - Archivo: `backend/Program.cs`
  - Notas: Agregar `builder.Services.AddScoped<ISesionService, SesionService>();` junto a los demás `AddScoped`. Si `App:BaseUrl` no existe en `appsettings.json`, agregar el key con valor por defecto `https://localhost:7001` (o el puerto del proyecto).

- [ ] **Tarea 9: Migración EF Core**
  - Archivo: `backend/Data/Migrations/{timestamp}_AddSesion.cs` (generado)
  - Notas: Ejecutar `dotnet ef migrations add AddSesion` desde `backend/`. Verificar en la migración generada:
    - Tabla `sesiones` con columnas correctas (`fecha` tipo `date`, `hora_inicio`/`hora_fin` tipo `time`, `created_at` tipo `timestamptz`)
    - FK `conferencia_id` → `conferencias(id)` ON DELETE CASCADE
    - FK `sala_id` → `salas(id)` ON DELETE RESTRICT
    - FK `expositor_id` → `expositores(id)` ON DELETE RESTRICT
    - Índice compuesto `(conferencia_id, fecha, hora_inicio)`
    - Documentar en `implementation-notes.md` si no hay PostgreSQL local para ejecutar `database update`.

- [ ] **Tarea 10: Cerrar TODO US-5 en `ConferenciaService`**
  - Archivo: `backend/Services/ConferenciaService.cs`
  - Notas: En `GetMisConferenciasAsync`, reemplazar `CantidadSesiones = 0` por:
    ```csharp
    CantidadSesiones = context.Sesiones.Count(s => s.ConferenciaId == c.Id)
    ```
    Esta expresión dentro de una proyección LINQ (`Select`) genera un `SELECT COUNT(*)` correlacionado. Es la misma tabla que ahora existe — sin breaking change en el DTO.

- [ ] **Tarea 11: Cerrar TODO US-5 en `SalaService.DeleteAsync`**
  - Archivo: `backend/Services/SalaService.cs`
  - Notas: Reemplazar el bloque:
    ```csharp
    // TODO US-5: reemplazar 0 por await context.Sesiones.AnyAsync(ses => ses.SalaId == id)
    var tieneSesiones = false;
    ```
    por:
    ```csharp
    var tieneSesiones = await context.Sesiones.AnyAsync(s => s.SalaId == id);
    ```

- [ ] **Tarea 12: Cerrar TODO US-5 en `ExpositorService.DeleteAsync`**
  - Archivo: `backend/Services/ExpositorService.cs`
  - Notas: Reemplazar:
    ```csharp
    var tieneSesiones = false; // TODO US-5: verificar sesiones asignadas
    ```
    por:
    ```csharp
    var tieneSesiones = await context.Sesiones.AnyAsync(s => s.ExpositorId == id);
    ```

#### Angular

- [ ] **Tarea 13: Interfaces TypeScript `sesion.model.ts`**
  - Archivo: `admin/src/app/sesiones/sesion.model.ts`
  - Notas:
    ```typescript
    export interface SesionDto {
      id: string;
      conferenciaId: string;
      salaId: string;
      salaNombre: string;
      expositorId: string;
      expositorNombre: string;
      titulo: string;
      descripcion?: string;
      fecha: string;       // 'YYYY-MM-DD'
      horaInicio: string;  // 'HH:mm:ss'
      horaFin: string;     // 'HH:mm:ss'
      track?: string;
      encuestaUrl?: string;
      qrCodeUrl?: string;
      creadoEn: string;
    }
    export interface CreateSesionDto {
      titulo: string;
      salaId: string;
      expositorId: string;
      fecha: string;
      horaInicio: string;
      horaFin: string;
      track?: string;
      descripcion?: string;
      encuestaUrl?: string;
    }
    export interface UpdateSesionDto extends Partial<CreateSesionDto> {}
    ```

- [ ] **Tarea 14: `SesionService` Angular**
  - Archivo: `admin/src/app/sesiones/sesion.service.ts`
  - Notas: `@Injectable({ providedIn: 'root' })`. URL base: `${environment.apiUrl}/api/dashboard/conferencias`. Métodos: `getSesiones(conferenciaId)`, `getById(id, conferenciaId)`, `create(conferenciaId, dto)`, `update(id, conferenciaId, dto)`, `delete(id, conferenciaId)`. Mismo patrón que `SalaService` y `ExpositorService`.

- [ ] **Tarea 15: `SesionesComponent` (lista + formulario)**
  - Archivo: `admin/src/app/sesiones/sesiones.component.ts`
  - Notas:
    - `standalone: true`, `ChangeDetectionStrategy.OnPush`.
    - Lee `conferenciaId` desde `ActivatedRoute.snapshot.params['id']`.
    - Signals: `sesiones = signal<SesionDto[]>([])`, `loading = signal(true)`, `mode = signal<'lista' | 'crear' | 'editar'>('lista')`, `editando = signal<SesionDto | null>(null)`.
    - Carga paralela en `ngOnInit`: sesiones del congreso + lista de salas (`SalaService.getSalas`) + lista de expositores (`ExpositorService.getAll`) — las listas se usan para poblar los selectores del formulario.
    - Formulario reactivo: `titulo` (required, maxlength 500), `salaId` (required, selector), `expositorId` (required, selector), `fecha` (required, input date), `horaInicio` (required, input time), `horaFin` (required, input time), `track` (opcional), `descripcion` (opcional), `encuestaUrl` (opcional).
    - Validador cruzado: `horaFin > horaInicio` (client-side).
    - Campo `qrCodeUrl` solo de lectura (mostrar en modo edición). Sin campo en el formulario.
    - Vista de lista: tabla con columnas `Título`, `Sala`, `Expositor`, `Fecha`, `Inicio`, `Fin`, `Track`, acciones `Editar`/`Eliminar`.
    - Submit: crear o actualizar según `mode()`.
    - Error 422 con `SALA_NOT_FOUND` o `EXPOSITOR_NOT_FOUND`: mostrar inline "La sala/el expositor no pertenece a este congreso."
    - Error 400 con `FECHA_FUERA_DE_RANGO`: mostrar inline en campo fecha.
    - No hay `window.confirm` obligatorio para eliminar — el DEV puede añadirlo opcionalmente.

- [ ] **Tarea 16: Actualizar `app.routes.ts`**
  - Archivo: `admin/src/app/app.routes.ts`
  - Notas: Agregar antes del catch-all `**`:
    ```typescript
    {
      path: 'congreso/:id/sesiones',
      canActivate: [authGuard],
      loadComponent: () => import('./sesiones/sesiones.component').then(m => m.SesionesComponent)
    }
    ```
  - El `DashboardComponent` ya tiene acciones por congreso (Salas, Expositores). El DEV debe agregar un enlace "Sesiones" por congreso que navegue a `/congreso/:id/sesiones`. Modificar `dashboard.component.ts`.

### Criterios de completitud técnica

El DEV puede considerar la historia técnicamente completa cuando:

- [ ] `dotnet build` sin warnings en `backend/`
- [ ] `dotnet ef migrations add AddSesion` genera tabla `sesiones` con FK Cascade hacia `conferencias`, FK Restrict hacia `salas` y `expositores`, índice compuesto `(conferencia_id, fecha, hora_inicio)`, columnas `fecha` tipo `date`, `hora_inicio`/`hora_fin` tipo `time`
- [ ] `GET /api/dashboard/conferencias/{conferenciaId}/sesiones` retorna 404 si el congreso no pertenece al usuario autenticado
- [ ] `POST` con `expositorId` de otro congreso retorna 422 con `EXPOSITOR_NOT_FOUND`
- [ ] `POST` con `salaId` de otro congreso retorna 422 con `SALA_NOT_FOUND`
- [ ] `POST` con `fecha` fuera del rango del congreso retorna 400 con `FECHA_FUERA_DE_RANGO`
- [ ] `POST` con `horaFin <= horaInicio` retorna 400 con `HORA_FIN_INVALIDA`
- [ ] La sesión creada incluye `qrCodeUrl` en la respuesta con formato `{baseUrl}/api/public/{slug}/sesiones/{id}`
- [ ] `GET /api/dashboard/conferencias` (US-2) retorna `cantidadSesiones` con el COUNT real de sesiones (no 0 hardcodeado)
- [ ] `DELETE /api/dashboard/conferencias/{id}/salas/{salaId}` retorna 422 cuando la sala tiene sesiones asignadas
- [ ] `DELETE /api/dashboard/conferencias/{id}/expositores/{expositorId}` retorna 422 cuando el expositor tiene sesiones asignadas
- [ ] `ng build` sin errores en `admin/`
- [ ] El componente `SesionesComponent` carga las listas de salas y expositores del congreso para usar en los selectores del formulario
- [ ] No hay `console.error` sin capturar en componentes Angular

---

## 5. Riesgos técnicos

| ID | Descripción | Probabilidad | Impacto | Mitigación propuesta |
|----|-------------|-------------|--------|---------------------|
| RT-5-01 | `TimeOnly` en EF Core + Npgsql 10. `TimeOnly` mapeado a `time` (sin zona horaria) es soportado en Npgsql 10 de forma nativa. Si el driver tiene algún edge case con valores como `00:00:00`, podría sillar en runtime. | Baja | Media | El DEV verifica con un test manual creando una sesión con `horaInicio = "08:00"` y `horaFin = "09:00"`. Si hay problema, usar `TimeSpan` como tipo de modelo con `HasColumnType("time")` como fallback y documentar en `implementation-notes.md`. LOG. |
| RT-5-02 | Ambigüedad de FK en `DeleteBehavior.Restrict` vs `NoAction` en PostgreSQL. EF Core genera `ON DELETE NO ACTION` en PostgreSQL para `Restrict`. Si hay sesiones asignadas y se intenta eliminar una sala/expositor sin pasar por el servicio (p.ej. directamente vía SQL), la BD rechazará con FK violation en lugar de 422. La lógica de aplicación mitiga esto para el camino normal. | Baja | Baja | Documentar en `implementation-notes.md`. La eliminación siempre pasa por los servicios en la arquitectura actual. LOG. |
| RT-5-03 | La subquery `context.Sesiones.Count(s => s.ConferenciaId == c.Id)` dentro del `Select` de `GetMisConferenciasAsync` cambia el plan de ejecución SQL. En congresos con muchas sesiones, el COUNT correlacionado puede ser lento si no hay índice en `(conferencia_id)` de la tabla `sesiones`. El índice compuesto `(ConferenciaId, Fecha, HoraInicio)` cubre esta query porque el primer campo es `ConferenciaId`. | Baja | Baja | El índice compuesto ya declarado cubre el COUNT. LOG. |
| RT-5-04 | El `SesionService` inyecta `IConfiguration` para leer `App:BaseUrl`. Si el key no existe en `appsettings.json`, `configuration["App:BaseUrl"]` retorna `null` y la URL del QR queda malformada. | Media | Media | El DEV debe agregar `"App": { "BaseUrl": "https://localhost:7001" }` en `appsettings.json` y `appsettings.Development.json`. Validar en `Program.cs` (o en el servicio con `?? throw new InvalidOperationException(...)`) al igual que se hace con `Jwt:SecretKey`. WARN. |

> RT-5-04 requiere acción antes de aprobar el plan: el DEV debe verificar y agregar la configuración `App:BaseUrl`. Se considera WARN (Media × Media) — el plan puede continuar pero el DEV debe resolverlo en la tarea de registro DI (Tarea 8).

---

## 6. Escalación arquitectónica

No aplica — la implementación es interna al módulo de sesiones. No se introduce ningún nuevo contenedor C4. El `qrCodeUrl` como URL de texto plano (sin generación de imagen en el backend) fue confirmado en la story: la imagen QR la genera el mini-sitio Next.js en cliente.

---

## 7. Contrato API

### `GET /api/dashboard/conferencias/{conferenciaId}/sesiones`
- Auth: Bearer JWT requerido
- Response 200:
```json
[
  {
    "id": "uuid",
    "conferenciaId": "uuid",
    "salaId": "uuid",
    "salaNombre": "Sala Principal",
    "expositorId": "uuid",
    "expositorNombre": "Jane Smith",
    "titulo": "Machine Learning en producción",
    "descripcion": null,
    "fecha": "2026-09-01",
    "horaInicio": "09:00:00",
    "horaFin": "10:00:00",
    "track": "IA",
    "encuestaUrl": "https://forms.google.com/...",
    "qrCodeUrl": "https://mi-congreso.tuplataforma.com/api/public/mi-congreso-2026/sesiones/uuid",
    "creadoEn": "2026-05-01T10:00:00Z"
  }
]
```
- Response 404: congreso no existe o no pertenece al usuario

### `POST /api/dashboard/conferencias/{conferenciaId}/sesiones`
- Auth: Bearer JWT requerido
- Body:
```json
{
  "titulo": "Machine Learning en producción",
  "salaId": "uuid",
  "expositorId": "uuid",
  "fecha": "2026-09-01",
  "horaInicio": "09:00:00",
  "horaFin": "10:00:00",
  "track": "IA",
  "descripcion": null,
  "encuestaUrl": null
}
```
- Response 201: `SesionDto` completo (incluye `qrCodeUrl` generado)
- Response 400: `titulo` ausente, `fecha` fuera de rango (`FECHA_FUERA_DE_RANGO`), `horaFin <= horaInicio` (`HORA_FIN_INVALIDA`)
- Response 404: congreso no existe o no pertenece al usuario
- Response 422: sala o expositor no pertenece al congreso (`SALA_NOT_FOUND`, `EXPOSITOR_NOT_FOUND`)

### `GET /api/dashboard/conferencias/{conferenciaId}/sesiones/{id}`
- Auth: Bearer JWT requerido
- Response 200: `SesionDto`
- Response 404: sesión no existe o no pertenece al congreso del usuario

### `PUT /api/dashboard/conferencias/{conferenciaId}/sesiones/{id}`
- Auth: Bearer JWT requerido
- Body: `UpdateSesionDto` (todos los campos opcionales, sin `qrCodeUrl`)
- Response 200: `SesionDto` actualizado
- Response 400: validaciones de fecha y hora
- Response 404: ownership fallido
- Response 422: sala o expositor no pertenece al congreso

### `DELETE /api/dashboard/conferencias/{conferenciaId}/sesiones/{id}`
- Auth: Bearer JWT requerido
- Response 204: eliminada correctamente
- Response 404: ownership fallido

---

## 8. Cambios en base de datos

### Nueva tabla: `sesiones`

| Columna | Tipo PG | Restricciones |
|---------|---------|--------------|
| `id` | `uuid` | PK, default `gen_random_uuid()` |
| `conferencia_id` | `uuid` | FK → `conferencias(id)` ON DELETE CASCADE, NOT NULL |
| `sala_id` | `uuid` | FK → `salas(id)` ON DELETE NO ACTION, NOT NULL |
| `expositor_id` | `uuid` | FK → `expositores(id)` ON DELETE NO ACTION, NOT NULL |
| `titulo` | `varchar(500)` | NOT NULL |
| `descripcion` | `text` | nullable |
| `fecha` | `date` | NOT NULL |
| `hora_inicio` | `time` | NOT NULL |
| `hora_fin` | `time` | NOT NULL |
| `track` | `varchar(100)` | nullable |
| `encuesta_url` | `text` | nullable |
| `qr_code_url` | `text` | nullable |
| `created_at` | `timestamptz` | NOT NULL, default `NOW()` |

### Índices

| Nombre | Columnas | Tipo |
|--------|----------|------|
| `IX_sesiones_ConferenciaId_Fecha_HoraInicio` | `(conferencia_id, fecha, hora_inicio)` | Compuesto |

---

## 9. Dependencias técnicas

- **US-2 completada y migración `AddConferencia` aplicada**: tabla `conferencias` debe existir.
- **US-3 completada y migración `AddSala` aplicada**: tabla `salas` debe existir (FK constraint de `sesiones`).
- **US-4 completada y migración `AddExpositor` aplicada**: tabla `expositores` debe existir (FK constraint de `sesiones`).
- **Configuración `App:BaseUrl`**: el DEV debe agregar este key en `appsettings.json` antes de implementar la generación del `qrCodeUrl`.

---

## Aprobación

- [x] Preguntas funcionales resueltas — sin preguntas abiertas; story especifica todos los comportamientos necesarios
- [x] Escalación arquitectónica — no aplica
- [x] Plan aprobado por TL

**Aprobado por:** Technical Lead
**Fecha de aprobación:** 2026-05-01
