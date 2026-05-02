# Implementation Plan 01 — US-2: Crear y configurar un congreso

**Date:** 2026-04-28
**Author:** Developer
**Technical plan:** [technical-plan.md](./technical-plan.md)
**Approach:** Ownership-scoped CRUD con ServiceResult<T> — mismo patrón que US-1

---

## Branch

- **Base:** `main`
- **Name:** `feature/US-2-gestion-congreso`

---

## Proposed changes

### Step 1: Modelo Conferencia + enum ConferenciaEstado

- **File:** `backend/Models/ConferenciaEstado.cs`
- **Action:** Create
- **What changes:** Enum `ConferenciaEstado` con tres miembros: `Borrador`, `Publicado`, `Finalizado`. Sin atributos adicionales — la conversión a string se define en la Fluent API.

- **File:** `backend/Models/Conferencia.cs`
- **Action:** Create
- **What changes:** Clase POCO `Conferencia` con propiedades:
  - `Guid Id`
  - `Guid UsuarioId`
  - `string Slug` (inicializado a `string.Empty`)
  - `string Nombre` (inicializado a `string.Empty`)
  - `string? Descripcion`
  - `DateOnly FechaInicio`
  - `DateOnly FechaFin`
  - `ConferenciaEstado Estado` (valor inicial `ConferenciaEstado.Borrador`)
  - `string? LogoUrl`
  - `string? LogoSecundarioUrl`
  - `string? BannerUrl`
  - `string? FaviconUrl`
  - `string? ColorPrimario`
  - `string? ColorSecundario`
  - `string? Tipografia`
  - `string? VenueNombre`
  - `string? VenueDireccion`
  - `string? VenueLinkMaps`
  - `DateTime CreatedAt`
  - Propiedad de navegación `Usuario Usuario` (inicializada con `null!`)

  No se incluyen colecciones de entidades hijas (Sala, Expositor, Sesion) — se agregarán en US-3/4/5.

---

### Step 2: ConferenciaConfiguration (Fluent API)

- **File:** `backend/Data/Configurations/ConferenciaConfiguration.cs`
- **Action:** Create
- **What changes:** Clase `ConferenciaConfiguration : IEntityTypeConfiguration<Conferencia>`. Método `Configure(EntityTypeBuilder<Conferencia> builder)` define:
  - `builder.ToTable("conferencias")`
  - PK: `HasDefaultValueSql("gen_random_uuid()")`
  - `Slug`: `IsRequired()`, `HasMaxLength(50)`, `HasIndex(...).IsUnique()` — nombre del índice: `IX_conferencias_Slug`
  - `Nombre`: `IsRequired()`, `HasMaxLength(255)`
  - `Estado`: `HasConversion<string>()`, `HasDefaultValue(ConferenciaEstado.Borrador)`, `IsRequired()`
  - `ColorPrimario`, `ColorSecundario`: `HasMaxLength(7)`, nullable
  - `Tipografia`: `HasMaxLength(100)`, nullable
  - `LogoUrl`, `LogoSecundarioUrl`, `BannerUrl`, `FaviconUrl`, `Descripcion`, `VenueNombre`, `VenueDireccion`, `VenueLinkMaps`: `HasColumnType("text")`, nullable (sin `.IsRequired()`)
  - `FechaInicio`, `FechaFin`: `HasColumnType("date")`, `IsRequired()`
  - `CreatedAt`: `HasColumnType("timestamptz")`, `HasDefaultValueSql("NOW()")`, `ValueGeneratedOnAdd()`
  - FK: `HasOne(c => c.Usuario).WithMany().HasForeignKey(c => c.UsuarioId).OnDelete(DeleteBehavior.Cascade)`
  - Índice compuesto: `HasIndex(c => new { c.UsuarioId, c.Estado })` con nombre `IX_conferencias_UsuarioId_Estado`

  Esta clase es descubierta automáticamente por `ApplyConfigurationsFromAssembly` — no requiere registro manual en `AppDbContext.OnModelCreating`.

---

### Step 3: Actualizar AppDbContext

- **File:** `backend/Data/AppDbContext.cs`
- **Action:** Modify
- **What changes:** Dos adiciones al archivo existente:
  1. Nueva propiedad: `public DbSet<Conferencia> Conferencias => Set<Conferencia>();` — a continuación de `RefreshTokens`, siguiendo el mismo patrón.
  2. Nuevo bloque en `SaveChangesAsync`: iterar `ChangeTracker.Entries<Conferencia>()` donde `State == EntityState.Added`; si `entry.Entity.CreatedAt == default`, asignar `DateTime.UtcNow`. Ubicado después del bloque de `RefreshToken`, antes del `return base.SaveChangesAsync(...)`.

---

### Step 4: DTOs de Conferencia

- **File:** `backend/DTOs/Conferencias/CreateConferenciaDto.cs`
- **Action:** Create
- **What changes:** Record o clase `CreateConferenciaDto` con:
  - `[Required] string Nombre`
  - `[Required] [RegularExpression(@"^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$|^[a-z0-9]{3}$")] string Slug` — la regex del plan técnico es `^[a-z0-9-]{3,50}$`; se usa exactamente esa expresión para alinearse con el contrato API
  - `[Required] DateOnly FechaInicio`
  - `[Required] DateOnly FechaFin`
  - Campos opcionales: `string? Descripcion`, `string? LogoUrl`, `string? LogoSecundarioUrl`, `string? BannerUrl`, `string? FaviconUrl`, `[MaxLength(7)] string? ColorPrimario`, `[MaxLength(7)] string? ColorSecundario`, `[MaxLength(100)] string? Tipografia`, `string? VenueNombre`, `string? VenueDireccion`, `string? VenueLinkMaps`
  - Todos los atributos de `System.ComponentModel.DataAnnotations`; el `[ApiController]` devuelve 400 automáticamente ante fallos.

- **File:** `backend/DTOs/Conferencias/UpdateConferenciaDto.cs`
- **Action:** Create
- **What changes:** Clase `UpdateConferenciaDto` con todos los campos de `CreateConferenciaDto` como nullable. `Slug` lleva la misma `[RegularExpression]` pero envuelta en condicional implícito (la validación de data annotations solo se dispara si el valor no es null, porque la propiedad es `string?`). `FechaInicio` y `FechaFin` son `DateOnly?`.

- **File:** `backend/DTOs/Conferencias/ConferenciaListItemDto.cs`
- **Action:** Create
- **What changes:** Record `ConferenciaListItemDto` con: `Guid Id`, `string Slug`, `string Nombre`, `string Estado`, `DateOnly FechaInicio`, `DateOnly FechaFin`, `int CantidadSesiones`. Sin atributos de validación — es DTO de salida.

- **File:** `backend/DTOs/Conferencias/ConferenciaDetalleDto.cs`
- **Action:** Create
- **What changes:** Record `ConferenciaDetalleDto` con todos los campos del modelo excepto `UsuarioId`: `Guid Id`, `string Slug`, `string Nombre`, `string? Descripcion`, `DateOnly FechaInicio`, `DateOnly FechaFin`, `string Estado`, `string? LogoUrl`, `string? LogoSecundarioUrl`, `string? BannerUrl`, `string? FaviconUrl`, `string? ColorPrimario`, `string? ColorSecundario`, `string? Tipografia`, `string? VenueNombre`, `string? VenueDireccion`, `string? VenueLinkMaps`, `DateTime CreatedAt`.

---

### Step 5: ConferenciaErrorCodes e IConferenciaService

- **File:** `backend/Services/ConferenciaErrorCodes.cs`
- **Action:** Create
- **What changes:** Clase estática `ConferenciaErrorCodes` con constantes string:
  - `SlugAlreadyExists = "SLUG_ALREADY_EXISTS"`
  - `ConferenciaNotFound = "CONFERENCIA_NOT_FOUND"`
  - `FechaInicioAfterFechaFin = "FECHA_INICIO_AFTER_FECHA_FIN"`
  - `SlugInvalidFormat = "SLUG_INVALID_FORMAT"`
  - `CannotDeleteNonDraft = "CANNOT_DELETE_NON_DRAFT"`
  - `CannotChangeSlugNonDraft = "CANNOT_CHANGE_SLUG_NON_DRAFT"`

  Patrón idéntico a `AuthErrorCodes` en `ServiceResult.cs`, pero en archivo separado para mantener la cohesión del módulo de congresos.

- **File:** `backend/Services/IConferenciaService.cs`
- **Action:** Create
- **What changes:** Interfaz `IConferenciaService` con firmas:
  - `Task<List<ConferenciaListItemDto>> GetMisConferenciasAsync(Guid usuarioId)`
  - `Task<ConferenciaDetalleDto?> GetByIdAsync(Guid id, Guid usuarioId)`
  - `Task<ServiceResult<ConferenciaDetalleDto>> CreateAsync(CreateConferenciaDto dto, Guid usuarioId)`
  - `Task<ServiceResult<ConferenciaDetalleDto>> UpdateAsync(Guid id, UpdateConferenciaDto dto, Guid usuarioId)`
  - `Task<ServiceResult> DeleteAsync(Guid id, Guid usuarioId)`

---

### Step 6: ConferenciaService

- **File:** `backend/Services/ConferenciaService.cs`
- **Action:** Create
- **What changes:** Clase `ConferenciaService(AppDbContext context) : IConferenciaService`. Constructor con primary constructor sintaxis (igual que `AuthService`). Implementa los cinco métodos:

  **`GetMisConferenciasAsync(Guid usuarioId)`**
  Query con `AsNoTracking()`, `Where(c => c.UsuarioId == usuarioId)`, proyección a `ConferenciaListItemDto` con `CantidadSesiones = 0` (literal hasta US-5). Ordenado por `CreatedAt` descendente. Retorna `List<ConferenciaListItemDto>`.

  **`GetByIdAsync(Guid id, Guid usuarioId)`**
  `AsNoTracking()`, `FirstOrDefaultAsync(c => c.Id == id && c.UsuarioId == usuarioId)`. Si null, retorna null (controller responde 404). Proyección a `ConferenciaDetalleDto`.

  **`CreateAsync(CreateConferenciaDto dto, Guid usuarioId)`**
  Pasos en orden: (1) Validar regex server-side con `Regex.IsMatch(dto.Slug, @"^[a-z0-9-]{3,50}$")` — si falla, `Fail(SlugInvalidFormat, ...)`; (2) Validar `dto.FechaInicio <= dto.FechaFin` — si falla, `Fail(FechaInicioAfterFechaFin, ...)`; (3) `AnyAsync(c => c.Slug == dto.Slug)` — si true, `Fail(SlugAlreadyExists, ...)`; (4) Construir entidad `Conferencia`, asignar `UsuarioId = usuarioId`, `Estado = ConferenciaEstado.Borrador`; (5) `context.Conferencias.Add(entity)` + `SaveChangesAsync()`; (6) Proyectar a `ConferenciaDetalleDto` y retornar `Ok(dto)`.

  **`UpdateAsync(Guid id, UpdateConferenciaDto dto, Guid usuarioId)`**
  Pasos: (1) `FirstOrDefaultAsync(c => c.Id == id && c.UsuarioId == usuarioId)` — tracking activo para modificar; si null, `Fail(ConferenciaNotFound, ...)`; (2) Si `dto.Slug != null && dto.Slug != entity.Slug && entity.Estado != ConferenciaEstado.Borrador`, `Fail(CannotChangeSlugNonDraft, ...)`; (3) Si `dto.Slug != null`, validar regex; si nuevo slug, verificar unicidad excluyendo propio id con `AnyAsync(c => c.Slug == dto.Slug && c.Id != id)`; (4) Validar fechas si ambas están presentes o combinarlas con los valores existentes; (5) Aplicar cambios sobre la entidad (asignación campo por campo para los no-null del DTO); (6) `SaveChangesAsync()`; (7) Proyectar y retornar `Ok(dto)`.

  **`DeleteAsync(Guid id, Guid usuarioId)`**
  Pasos: (1) `FirstOrDefaultAsync(c => c.Id == id && c.UsuarioId == usuarioId)` — tracking activo; si null, `Fail(ConferenciaNotFound, ...)`; (2) Si `entity.Estado != ConferenciaEstado.Borrador`, `Fail(CannotDeleteNonDraft, ...)`; (3) `context.Conferencias.Remove(entity)` + `SaveChangesAsync()`; (4) `ServiceResult.Ok()`.

---

### Step 7: ConferenciasController

- **File:** `backend/Controllers/ConferenciasController.cs`
- **Action:** Create
- **What changes:** Clase `ConferenciasController(IConferenciaService conferenciaService) : ControllerBase` con atributos `[ApiController]`, `[Authorize]`, `[Route("api/dashboard/conferencias")]`.

  Extracción de `usuarioId` mediante método privado o inline: `Guid.Parse(User.FindFirstValue(JwtRegisteredClaimNames.Sub)!)`. El using requerido: `System.IdentityModel.Tokens.Jwt`.

  Cinco action methods:

  - `GET /` → `GetMisConferencias()`: llama `GetMisConferenciasAsync(usuarioId)`, retorna `Ok(lista)` — 200.

  - `POST /` → `CreateConferencia([FromBody] CreateConferenciaDto dto)`: llama `CreateAsync(dto, usuarioId)`. Si `Success`, `CreatedAtAction(nameof(GetConferencia), new { id = result.Data!.Id }, result.Data)` — 201. Errores: `SlugAlreadyExists` → `Conflict(new { error, message })` — 409; `FechaInicioAfterFechaFin` | `SlugInvalidFormat` → `BadRequest(new { error, message })` — 400.

  - `GET /{id}` → `GetConferencia(Guid id)`: llama `GetByIdAsync(id, usuarioId)`. Si null, `NotFound()` — 404. Si encontrado, `Ok(detalle)` — 200.

  - `PUT /{id}` → `UpdateConferencia(Guid id, [FromBody] UpdateConferenciaDto dto)`: llama `UpdateAsync(id, dto, usuarioId)`. Si `Success`, `Ok(result.Data)` — 200. Errores: `ConferenciaNotFound` → `NotFound()` — 404; `SlugAlreadyExists` → `Conflict(...)` — 409; `FechaInicioAfterFechaFin` | `SlugInvalidFormat` | `CannotChangeSlugNonDraft` → `BadRequest(...)` — 400.

  - `DELETE /{id}` → `DeleteConferencia(Guid id)`: llama `DeleteAsync(id, usuarioId)`. Si `Success`, `NoContent()` — 204. Errores: `ConferenciaNotFound` → `NotFound()` — 404; `CannotDeleteNonDraft` → `StatusCode(422, new { error, message })` — 422.

---

### Step 8: Registrar ConferenciaService en Program.cs

- **File:** `backend/Program.cs`
- **Action:** Modify
- **What changes:** Agregar una línea en el bloque `// ── Application Services ──`:
  `builder.Services.AddScoped<IConferenciaService, ConferenciaService>();`
  Ubicada inmediatamente después de `AddScoped<IAuthService, AuthService>()`, respetando el orden existente.

---

### Step 9: Migración EF Core

- **File:** `backend/Data/Migrations/{timestamp}_AddConferencia.cs` (generado por tooling)
- **Action:** Create (via `dotnet ef migrations add AddConferencia`)
- **What changes:** La migración generada debe incluir: creación de tabla `conferencias` con todas las columnas del esquema, índice único en `slug` (`IX_conferencias_Slug`), índice compuesto `(usuario_id, estado)` (`IX_conferencias_UsuarioId_Estado`), FK `usuario_id` → `usuarios(id)` con `ON DELETE CASCADE`. Se verifica el snapshot generado antes de confirmar el commit. No se ejecuta `database update` si no hay PostgreSQL local — se documenta en `implementation-notes.md`.

---

### Step 10: Interfaces TypeScript de DTOs (Angular)

- **File:** `admin/src/app/congresos/congreso.model.ts`
- **Action:** Create
- **What changes:** Archivo con interfaces y tipos:
  - `type EstadoCongreso = 'Borrador' | 'Publicado' | 'Finalizado'`
  - `interface CongresoListItemDto { id: string; slug: string; nombre: string; estado: EstadoCongreso; fechaInicio: string; fechaFin: string; cantidadSesiones: number; }`
  - `interface CongresoDetalleDto { id: string; slug: string; nombre: string; descripcion: string | null; estado: EstadoCongreso; fechaInicio: string; fechaFin: string; logoUrl: string | null; logoSecundarioUrl: string | null; bannerUrl: string | null; faviconUrl: string | null; colorPrimario: string | null; colorSecundario: string | null; tipografia: string | null; venueNombre: string | null; venueDireccion: string | null; venueLinkMaps: string | null; createdAt: string; }`
  - `interface CreateCongresoDto { nombre: string; slug: string; fechaInicio: string; fechaFin: string; descripcion?: string; logoUrl?: string; logoSecundarioUrl?: string; bannerUrl?: string; faviconUrl?: string; colorPrimario?: string; colorSecundario?: string; tipografia?: string; venueNombre?: string; venueDireccion?: string; venueLinkMaps?: string; }`
  - `interface UpdateCongresoDto` — igual que `CreateCongresoDto` pero todos los campos opcionales (`Partial<CreateCongresoDto>` o declarado manualmente).

  Las fechas se representan como `string` en ISO 8601 (`"2026-09-01"`) porque la serialización JSON de `DateOnly` en .NET produce string plano.

---

### Step 11: CongresoService Angular

- **File:** `admin/src/app/congresos/congreso.service.ts`
- **Action:** Create
- **What changes:** Clase `CongresoService` con `@Injectable({ providedIn: 'root' })`. `HttpClient` inyectado con `inject(HttpClient)`. URL base calculada como `${environment.apiUrl}/api/dashboard/conferencias`.

  Cinco métodos públicos que retornan `Observable<T>`:
  - `getMisCongresos(): Observable<CongresoListItemDto[]>` — GET a la URL base
  - `getById(id: string): Observable<CongresoDetalleDto>` — GET a `${base}/${id}`
  - `create(dto: CreateCongresoDto): Observable<CongresoDetalleDto>` — POST a URL base con body `dto`
  - `update(id: string, dto: UpdateCongresoDto): Observable<CongresoDetalleDto>` — PUT a `${base}/${id}`
  - `delete(id: string): Observable<void>` — DELETE a `${base}/${id}`

  El interceptor `authInterceptor` ya agrega el header `Authorization: Bearer` automáticamente — no requiere headers manuales aquí. Mismo patrón que `AuthService`.

---

### Step 12: DashboardComponent — reemplazar stub

- **File:** `admin/src/app/dashboard/dashboard.component.ts`
- **Action:** Modify
- **What changes:** Reemplazar el stub actual (template inline con saludo y botón de logout) con una implementación completa:

  - Inyectar `CongresoService` y `Router` con `inject()`, junto al ya existente `AuthService`.
  - Signal: `congresos = signal<CongresoListItemDto[]>([])` y `loading = signal<boolean>(true)`.
  - `ngOnInit()`: llamar `congresoService.getMisCongresos()` con `.subscribe({ next: data => { this.congresos.set(data); this.loading.set(false); }, error: () => this.loading.set(false) })`.
  - Template inline (manteniendo el componente standalone): tabla con columnas Nombre, Slug, Estado (badge visual con clase CSS según estado), Fecha Inicio, Fecha Fin, Cantidad Sesiones, columna Acciones con botón "Gestionar" que navega a `/congreso/${congreso.id}/configuracion`. Botón "Nuevo congreso" en la cabecera que navega a `/congreso/nuevo`. Mensaje condicional cuando `congresos().length === 0` y `!loading()`.
  - Agregar `RouterLink` o usar `Router.navigate()` para la navegación. Imports del componente: `CommonModule`, `RouterLink` (o `RouterModule`).
  - Mantener `ChangeDetectionStrategy.OnPush` y `standalone: true`.

---

### Step 13: CongresoFormComponent

- **File:** `admin/src/app/congresos/congreso-form/congreso-form.component.ts`
- **Action:** Create
- **What changes:** Componente standalone `CongresoFormComponent` con `ChangeDetectionStrategy.OnPush`.

  Imports del componente: `ReactiveFormsModule`, `CommonModule`, `RouterLink`.
  Servicios inyectados: `CongresoService`, `ActivatedRoute`, `Router`, `FormBuilder`.

  **Detección de modo:** en `ngOnInit`, leer `this.route.snapshot.paramMap.get('id')` y asignarlo a `this.congresoId: string | null`. Si no null → modo edición: llamar `congresoService.getById(this.congresoId)` y parchear el form con `patchValue()`. En modo edición, si `congreso.estado !== 'Borrador'`, deshabilitar el control `slug` con `this.form.get('slug')?.disable()`.

  **Reactive form con FormBuilder:**
  - `nombre`: `[required]`
  - `slug`: `[required, pattern('^[a-z0-9-]{3,50}$')]`
  - `fechaInicio`: `[required]`
  - `fechaFin`: `[required]`
  - `descripcion`, `logoUrl`, `logoSecundarioUrl`, `bannerUrl`, `faviconUrl`: sin validadores
  - `colorPrimario`, `colorSecundario`: `[maxlength(7)]`
  - `tipografia`: `[maxlength(100)]`
  - `venueNombre`, `venueDireccion`, `venueLinkMaps`: sin validadores
  - Validador cruzado a nivel de form group: función `fechasConsistentesValidator` que verifica `fechaFin >= fechaInicio` y retorna `{ fechasInconsistentes: true }` si falla.

  **Auto-sugerencia de slug:** en `ngOnInit`, suscribirse a `this.form.get('nombre')!.valueChanges`. Si `!this.slugManuallyEdited` (flag booleano, inicialmente `false`), aplicar transformación: `normalize('NFD')`, strip diacríticos con regex `/[̀-ͯ]/g`, lowercase, reemplazar no-`[a-z0-9]` por `-`, colapsar guiones múltiples `/\-+/g`, trim guiones al inicio/fin, truncar a 50 chars; patchear control `slug` con el resultado sin marcar el flag. Suscribirse también a `valueChanges` del control `slug` para detectar edición manual y activar `slugManuallyEdited = true` (con cuidado de no disparar el flag cuando el propio código hace `patchValue`).

  **Submit:** método `onSubmit()`: si `this.congresoId` → `congresoService.update(this.congresoId, dto)`, si no → `congresoService.create(dto)`. Mapear el form value a `CreateCongresoDto` o `UpdateCongresoDto`. En éxito: navegar a `/dashboard`. En error: capturar respuestas 409 (slug duplicado) y 400 (fechas) y mostrar mensaje inline con signal `errorMessage = signal<string | null>(null)`.

  Template inline con el formulario reactivo, mensajes de error por campo, y mensaje de error de API.

---

### Step 14: Rutas Angular nuevas

- **File:** `admin/src/app/app.routes.ts`
- **Action:** Modify
- **What changes:** Agregar dos rutas dentro del array `routes`, antes del wildcard `{ path: '**', redirectTo: 'dashboard' }`:
  - `{ path: 'congreso/nuevo', canActivate: [authGuard], loadComponent: () => import('./congresos/congreso-form/congreso-form.component').then(m => m.CongresoFormComponent) }`
  - `{ path: 'congreso/:id/configuracion', canActivate: [authGuard], loadComponent: () => import('./congresos/congreso-form/congreso-form.component').then(m => m.CongresoFormComponent) }`

  El mismo componente se usa para ambas rutas; el modo se determina internamente por la presencia del parámetro `:id`. Ambas rutas requieren `authGuard` — ya importado en el archivo.

---

## Commits planned

1. `feat(US-2): add Conferencia model, EF config and migration`
   Cubre Steps 1, 2, 3 y 9 (modelo, enum, Fluent API, DbSet en AppDbContext, migración generada).

2. `feat(US-2): add Conferencia DTOs`
   Cubre Step 4 (los cuatro DTOs en `backend/DTOs/Conferencias/`).

3. `feat(US-2): implement ConferenciaService with ownership and ServiceResult`
   Cubre Step 5 y 6 (error codes, interfaz e implementación del servicio).

4. `feat(US-2): implement ConferenciasController with 5 endpoints`
   Cubre Step 7 (controller con los cinco endpoints y mapeo de errores).

5. `chore(US-2): register ConferenciaService in DI`
   Cubre Step 8 (una línea en Program.cs).

6. `feat(US-2): implement Angular CongresoService`
   Cubre Steps 10 y 11 (interfaces TypeScript y servicio HTTP Angular).

7. `feat(US-2): update DashboardComponent with congreso list`
   Cubre Step 12 (reemplazo del stub de DashboardComponent).

8. `feat(US-2): implement CongresoFormComponent create and edit`
   Cubre Step 13 (componente de formulario con auto-slug y validación cruzada).

9. `chore(US-2): add congreso routes to app.routes.ts`
   Cubre Step 14 (dos rutas nuevas con lazy loading).

---

## Trade-offs

- **Pros:**
  - Cero desviación del patrón establecido en US-1: primary constructor, `AsNoTracking`, `ServiceResult<T>`, `ApplyConfigurationsFromAssembly`, `inject()` en Angular. No hay fricción para el equipo que ya conoce el patrón.
  - Los DTOs de salida son records inmutables — thread-safe y sin riesgo de mutación accidental.
  - `ConferenciaErrorCodes` en archivo separado mantiene el módulo de congresos cohesivo sin contaminar `ServiceResult.cs` con constantes de otro dominio.
  - El `CantidadSesiones = 0` hardcodeado en la proyección LINQ es explícito y documentado — sin magia ni deuda técnica oculta. El cambio en US-5 será quirúrgico (reemplazar el literal por subquery).
  - El flag `slugManuallyEdited` en el formulario Angular garantiza que la auto-sugerencia no pisa ediciones intencionales del usuario — comportamiento UX correcto sin complejidad adicional.
  - Cascade delete configurado en la FK de EF Core (no en lógica de aplicación) — el motor de BD garantiza la integridad independientemente de la capa de servicio.

- **Cons:**
  - El componente `CongresoFormComponent` maneja dos modos en uno (crear y editar), lo que agrega algo de complejidad condicional. La alternativa de dos componentes separados reduciría esa complejidad pero duplicaría el formulario. El plan técnico ya decidió el enfoque de un solo componente.
  - La gestión del flag `slugManuallyEdited` con `valueChanges` requiere cuidado para no disparar ciclos innecesarios de detección de cambios con `OnPush`. El DEV debe usar `{ emitEvent: false }` al parchear el slug desde el código.
  - Sin PostgreSQL local, la migración no puede verificarse en runtime hasta el despliegue. Se documenta en `implementation-notes.md` según RT-2-01.
  - El `UpdateConferenciaDto` con campos todos opcionales requiere lógica explícita en el servicio para combinar valores existentes con los del DTO (no hay un `PATCH` automático). La implementación aplica un `if (dto.X != null) entity.X = dto.X;` por cada campo — verboso pero legible y testeable.

## Comparison with other plans

Single plan — no alternatives produced.

El plan técnico aprobado especifica un único enfoque sin ambigüedad técnica: el patrón de US-1 aplicado al módulo de congresos. No existen decisiones arquitectónicas abiertas que justifiquen planes alternativos. Las únicas variantes posibles (dos componentes Angular separados en lugar de uno, o `PATCH` en lugar de `PUT`) están explícitamente resueltas en el plan técnico (un componente, `PUT` con campos opcionales).
