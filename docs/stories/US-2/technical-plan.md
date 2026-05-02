# Technical Plan — US-2: Crear y configurar un congreso

**Date:** 2026-04-28
**Author:** Technical Lead
**Story:** [US-2](./story.md)
**Status:** Approved

---

## 1. Analysis summary

US-2 introduce la entidad central del sistema: `Conferencia`. Toda la funcionalidad posterior del producto —salas, sesiones, expositores, mini-sitio público, certificados— existe en el contexto de un congreso concreto. Esta historia establece el CRUD completo de congresos bajo JWT, con las reglas de negocio de ownership (cada organizador solo opera sobre sus propios congresos), unicidad global del slug, y restricciones de estado sobre edición del slug y eliminación.

El impacto es exclusivamente interno al dominio de congresos. No se modifica ningún contrato existente del módulo de autenticación (US-1). El patrón de implementación es idéntico al ya establecido: modelo EF Core con Fluent API, configuración separada en `Data/Configurations/`, `ServiceResult<T>` para errores de dominio, y controller `[Authorize]` que extrae `usuarioId` del claim `sub`. El claim `sub` ya está emitido correctamente por `JwtService.GenerateAccessToken` (confirmado en código). El Angular sigue el patrón de servicios HTTP con signals ya presente en `AuthService`.

---

## 2. Impact analysis

### Archivos y módulos afectados

| Archivo / Módulo | Tipo de cambio | Razón |
|-----------------|---------------|-------|
| `backend/Models/Conferencia.cs` | Creación | Entidad de dominio nueva |
| `backend/Models/ConferenciaEstado.cs` | Creación | Enum de estado (Borrador, Publicado, Finalizado) |
| `backend/Data/Configurations/ConferenciaConfiguration.cs` | Creación | Fluent API: índices, FK, conversión de enum |
| `backend/Data/AppDbContext.cs` | Modificación | Agregar `DbSet<Conferencia>` y lógica `CreatedAt` en `SaveChangesAsync` |
| `backend/DTOs/Conferencias/CreateConferenciaDto.cs` | Creación | DTO de entrada para POST |
| `backend/DTOs/Conferencias/UpdateConferenciaDto.cs` | Creación | DTO de entrada para PUT |
| `backend/DTOs/Conferencias/ConferenciaListItemDto.cs` | Creación | DTO de salida para listado (con CantidadSesiones) |
| `backend/DTOs/Conferencias/ConferenciaDetalleDto.cs` | Creación | DTO de salida completo para GET por id y mutaciones |
| `backend/Services/IConferenciaService.cs` | Creación | Interfaz del servicio |
| `backend/Services/ConferenciaService.cs` | Creación | Implementación: CRUD + validaciones de negocio |
| `backend/Services/ConferenciaErrorCodes.cs` | Creación | Constantes de error code (a agregar en `ServiceResult.cs` o archivo propio) |
| `backend/Controllers/ConferenciasController.cs` | Creación | 5 endpoints bajo `[Authorize]` |
| `backend/Data/Migrations/{timestamp}_AddConferencia.cs` | Creación | Migración EF Core |
| `backend/Program.cs` | Modificación | Registrar `IConferenciaService` en DI |
| `admin/src/app/congresos/congreso.service.ts` | Creación | Servicio HTTP Angular |
| `admin/src/app/congresos/congreso.model.ts` | Creación | Interfaces TypeScript de DTOs |
| `admin/src/app/dashboard/dashboard.component.ts` | Modificación | Reemplazar stub: listar congresos, botón "Nuevo congreso" |
| `admin/src/app/congresos/congreso-form/congreso-form.component.ts` | Creación | Reactive form: crear y editar congreso |
| `admin/src/app/app.routes.ts` | Modificación | Agregar rutas `/congreso/nuevo` y `/congreso/:id/configuracion` |

### Impacto en otros módulos (regresión potencial)

| Módulo | Riesgo de regresión | Mitigación |
|--------|--------------------|---------  |
| `AppDbContext` | Bajo — se agrega DbSet y bloque en SaveChangesAsync; no se toca lógica existente | QAA verifica que el snapshot de migración no rompe la migración InitialCreate |
| `DashboardController` | Bajo — el stub actual (`GET /api/dashboard/test`) no es usado en producción; se mantiene o elimina según decisión del DEV | Ninguna acción necesaria; el endpoint no tiene tests |
| `AuthController` / `AuthService` | Ninguno — no se modifica ningún contrato de autenticación | — |
| `admin/app.routes.ts` | Bajo — se agregan rutas nuevas con lazy loading; el redirect `**` existente permanece | QAA verifica que login y dashboard actuales siguen funcionando |

### Impacto arquitectónico

- [x] **No** — la implementación es interna al módulo de congresos. El patrón de servicio + controller + EF Core ya está establecido en US-1. No se introduce ningún nuevo contenedor C4 ni integración externa.

---

## 3. Preguntas funcionales detectadas

Ninguna — la historia está suficientemente especificada. Todos los riesgos funcionales identificados (RISK-02-01 a RISK-02-04) están resueltos por el PO en la sección "Open questions" de la story.

> Estado: No hay preguntas pendientes.

---

## 4. Plan de trabajo

### Enfoque técnico

La implementación sigue estrictamente el patrón establecido en US-1:

- **Modelo**: clase POCO con propiedades tipadas, incluyendo `DateOnly` para `FechaInicio`/`FechaFin` (soportado nativamente por EF Core 8 + Npgsql). El enum `ConferenciaEstado` se persiste como `text` en PostgreSQL mediante `HasConversion<string>()` en la configuración Fluent API, garantizando legibilidad en la BD.
- **Configuración**: `ConferenciaConfiguration : IEntityTypeConfiguration<Conferencia>` en `Data/Configurations/`, descubierta automáticamente por `ApplyConfigurationsFromAssembly` ya presente en `AppDbContext.OnModelCreating`.
- **Servicio**: `ConferenciaService` con `AppDbContext` inyectado directamente (igual que `AuthService`). Todas las queries de lectura usan `AsNoTracking()`. La validación de slug duplicado se hace con `AnyAsync` antes de insertar. El `ServiceResult<T>` existente se reutiliza sin modificaciones.
- **Controller**: `[ApiController]`, `[Authorize]`, `[Route("api/dashboard/conferencias")]`. El `usuarioId` se extrae con `User.FindFirstValue(JwtRegisteredClaimNames.Sub)` — el claim `sub` ya está emitido como `usuario.Id.ToString()` en `JwtService`.
- **Angular**: servicio standalone con `HttpClient`, signals para estado reactivo en `DashboardComponent`, formulario reactivo en `CongresoFormComponent`. Mismo patrón que `AuthService`.

La lógica de `CantidadSesiones` en `ConferenciaListItemDto` se implementa con una subquery EF Core (`context.Sesiones.Count(s => s.ConferenciaId == c.Id)`) dentro de la proyección LINQ — esto genera un `SELECT COUNT(*)` correlacionado eficiente. En US-2 la tabla `sesiones` no existe aún, por lo que `CantidadSesiones` siempre retorna 0: la proyección debe reflejar este hecho mediante un literal `0` en la query hasta que US-5 cree la tabla. El DEV debe documentar esto en `implementation-notes.md`.

### Tareas de implementación

> Las ramas siguen el patrón `feature/US-{N}-{short-title}` definido en `.claude/settings.json`. El DEV opera sobre la rama `feature/US-2-gestion-congresos`. Como `pipeline.devPlanReview` es `true`, el DEV producirá primero un `implementation-plan-01.md` para revisión del usuario antes de escribir código.

#### Backend

- [ ] **Tarea 1: Modelo `Conferencia` y enum `ConferenciaEstado`**
  - Archivos: `backend/Models/ConferenciaEstado.cs`, `backend/Models/Conferencia.cs`
  - Notas: `FechaInicio` y `FechaFin` como `DateOnly`. Propiedad de navegación `Usuario`. `ICollection<>` de entidades hijas (Sala, Expositor, Sesion) se agrega en sus respectivas historias; NO incluir aquí para evitar referencias a modelos inexistentes.

- [ ] **Tarea 2: `ConferenciaConfiguration` (Fluent API)**
  - Archivos: `backend/Data/Configurations/ConferenciaConfiguration.cs`
  - Notas:
    - Tabla: `"conferencias"`
    - PK: `HasDefaultValueSql("gen_random_uuid()")`
    - `Slug`: `IsRequired()`, `HasMaxLength(50)`, `HasIndex(...).IsUnique()`
    - `Nombre`: `IsRequired()`, `HasMaxLength(255)`
    - `Estado`: `HasConversion<string>()`, valor por defecto `ConferenciaEstado.Borrador` via `HasDefaultValue`
    - `ColorPrimario`, `ColorSecundario`: `HasMaxLength(7)`
    - `Tipografia`: `HasMaxLength(100)`
    - `LogoUrl`, `LogoSecundarioUrl`, `BannerUrl`, `FaviconUrl`, `Descripcion`, `VenueNombre`, `VenueDireccion`, `VenueLinkMaps`: nullable, sin longitud fija (columna `text`)
    - `CreatedAt`: `HasColumnType("timestamptz")`, `HasDefaultValueSql("NOW()")`, `ValueGeneratedOnAdd()`
    - FK `UsuarioId`: `HasOne(c => c.Usuario).WithMany(...).HasForeignKey(c => c.UsuarioId).OnDelete(DeleteBehavior.Cascade)`
    - Índice compuesto: `HasIndex(c => new { c.UsuarioId, c.Estado })` (para la query de listado)
    - `FechaInicio`, `FechaFin`: `HasColumnType("date")`

- [ ] **Tarea 3: Actualizar `AppDbContext`**
  - Archivos: `backend/Data/AppDbContext.cs`
  - Notas: Agregar `public DbSet<Conferencia> Conferencias => Set<Conferencia>();`. Agregar bloque en `SaveChangesAsync` para poblar `CreatedAt` en entradas `Conferencia` con estado `Added`, igual que el bloque de `Usuario`.

- [ ] **Tarea 4: DTOs de Conferencia**
  - Archivos: `backend/DTOs/Conferencias/CreateConferenciaDto.cs`, `UpdateConferenciaDto.cs`, `ConferenciaListItemDto.cs`, `ConferenciaDetalleDto.cs`
  - Notas:
    - `CreateConferenciaDto`: `Nombre` required, `Slug` required con `[RegularExpression(@"^[a-z0-9-]{3,50}$")]`, `FechaInicio` y `FechaFin` required como `DateOnly`.
    - `UpdateConferenciaDto`: todos los campos opcionales (nullable). `Slug` con la misma regex si no es null.
    - `ConferenciaListItemDto`: `Id`, `Slug`, `Nombre`, `Estado` (string), `FechaInicio`, `FechaFin`, `CantidadSesiones` (int, hardcoded a 0 hasta US-5).
    - `ConferenciaDetalleDto`: todos los campos del modelo excepto `UsuarioId` (no exponer).
    - Usar `System.ComponentModel.DataAnnotations` para validaciones en los DTOs de entrada — el `[ApiController]` attribute ya devuelve 400 automáticamente.

- [ ] **Tarea 5: `ConferenciaErrorCodes` y `IConferenciaService`**
  - Archivos: `backend/Services/ConferenciaErrorCodes.cs`, `backend/Services/IConferenciaService.cs`
  - Notas: Constantes: `SlugAlreadyExists`, `ConferenciaNotFound`, `FechaInicioAfterFechaFin`, `SlugInvalidFormat`, `CannotDeleteNonDraft`, `CannotChangeSlugNonDraft`.

- [ ] **Tarea 6: `ConferenciaService`**
  - Archivos: `backend/Services/ConferenciaService.cs`
  - Notas:
    - `GetMisConferenciasAsync(Guid usuarioId)`: query con `AsNoTracking()`, `Where(c => c.UsuarioId == usuarioId)`, proyección a `ConferenciaListItemDto` con `CantidadSesiones = 0` (literal hasta US-5). Ordenar por `CreatedAt DESC`.
    - `GetByIdAsync(Guid id, Guid usuarioId)`: `AsNoTracking()`, filtra por `Id` y `UsuarioId` — si no existe o no pertenece al usuario, retorna `null` (el controller responde 404).
    - `CreateAsync`: (1) validar regex slug server-side con `Regex.IsMatch`; (2) validar `FechaInicio <= FechaFin`; (3) verificar unicidad de slug con `AnyAsync`; (4) crear y persistir. Retorna `ServiceResult<ConferenciaDetalleDto>`.
    - `UpdateAsync`: (1) verificar ownership con `FirstOrDefaultAsync(c => c.Id == id && c.UsuarioId == usuarioId)`; (2) si no existe, `Fail(ConferenciaNotFound)`; (3) si se intenta cambiar slug y estado != `Borrador`, `Fail(CannotChangeSlugNonDraft)`; (4) validar nuevo slug si presente (regex + unicidad excluyendo el propio id: `AnyAsync(c => c.Slug == dto.Slug && c.Id != id)`); (5) aplicar cambios y `SaveChangesAsync`.
    - `DeleteAsync`: (1) verificar ownership; (2) verificar `Estado == Borrador`, si no `Fail(CannotDeleteNonDraft)` (controller retorna 422); (3) `context.Conferencias.Remove(entity)` — EF Core ejecutará `DELETE` con cascade por FK.

- [ ] **Tarea 7: `ConferenciasController`**
  - Archivos: `backend/Controllers/ConferenciasController.cs`
  - Notas:
    - Extraer `usuarioId`: `Guid.Parse(User.FindFirstValue(JwtRegisteredClaimNames.Sub)!)` — si el token es válido, el claim siempre existe.
    - `GET /` → 200 con lista.
    - `POST /` → 201 con `ConferenciaDetalleDto`; en caso de error: `SlugAlreadyExists` → 409, `FechaInicioAfterFechaFin` / `SlugInvalidFormat` → 400.
    - `GET /{id}` → 200 o 404.
    - `PUT /{id}` → 200 o 404 (ownership) o 409 (slug duplicado) o 400 (fechas/formato).
    - `DELETE /{id}` → 204; `CannotDeleteNonDraft` → 422; ownership fallido → 404.
    - Para errores 422 usar `StatusCode(422, new { error = ..., message = ... })`.

- [ ] **Tarea 8: Registro DI en `Program.cs`**
  - Archivos: `backend/Program.cs`
  - Notas: `builder.Services.AddScoped<IConferenciaService, ConferenciaService>();` — agregar junto a los demás `AddScoped` existentes.

- [ ] **Tarea 9: Migración EF Core**
  - Archivos: `backend/Data/Migrations/{timestamp}_AddConferencia.cs` (generado)
  - Notas: Ejecutar `dotnet ef migrations add AddConferencia` desde `backend/`. Verificar que la migración generada incluye: tabla `conferencias`, índice único en `slug`, índice compuesto `(usuario_id, estado)`, FK con `ON DELETE CASCADE` hacia `usuarios`. No ejecutar `database update` si no hay PostgreSQL local — documentar en `implementation-notes.md`.

#### Angular

- [ ] **Tarea 10: Interfaces TypeScript de DTOs**
  - Archivos: `admin/src/app/congresos/congreso.model.ts`
  - Notas: Interfaces `CreateCongresoDto`, `UpdateCongresoDto`, `CongresoListItemDto`, `CongresoDetalleDto`. Enum como union type: `type EstadoCongreso = 'Borrador' | 'Publicado' | 'Finalizado'`.

- [ ] **Tarea 11: `CongresoService`**
  - Archivos: `admin/src/app/congresos/congreso.service.ts`
  - Notas: `@Injectable({ providedIn: 'root' })`, `HttpClient` inyectado. Métodos: `getMisCongresos(): Observable<CongresoListItemDto[]>`, `getById(id: string): Observable<CongresoDetalleDto>`, `create(dto: CreateCongresoDto): Observable<CongresoDetalleDto>`, `update(id: string, dto: UpdateCongresoDto): Observable<CongresoDetalleDto>`, `delete(id: string): Observable<void>`. URL base: `${environment.apiUrl}/api/dashboard/conferencias`.

- [ ] **Tarea 12: `DashboardComponent` (reemplazar stub)**
  - Archivos: `admin/src/app/dashboard/dashboard.component.ts`
  - Notas: Signal `congresos = signal<CongresoListItemDto[]>([])`. En `ngOnInit` (o `effect`): llamar `congresoService.getMisCongresos()` y setear signal. Template: tabla/lista con nombre, slug, estado (badge CSS), fechas, cantidad sesiones, botón "Gestionar" (navega a `/congreso/:id/configuracion`), botón "Nuevo congreso" (navega a `/congreso/nuevo`). `ChangeDetectionStrategy.OnPush` — mantener.

- [ ] **Tarea 13: `CongresoFormComponent`**
  - Archivos: `admin/src/app/congresos/congreso-form/congreso-form.component.ts`
  - Notas:
    - `standalone: true`, `ChangeDetectionStrategy.OnPush`.
    - `ActivatedRoute` para detectar si hay `:id` (modo edición) o no (modo creación).
    - En modo edición: cargar datos con `congresoService.getById(id)` y parchear el formulario.
    - Reactive form con `FormBuilder`. Campos: `nombre` (required), `slug` (required, pattern `^[a-z0-9-]{3,50}$`), `fechaInicio` (required), `fechaFin` (required), `descripcion`, `logoUrl`, `colorPrimario` (maxlength 7), `colorSecundario` (maxlength 7), `tipografia` (maxlength 100), `venueNombre`, `venueDireccion`, `venueLinkMaps`.
    - Validador cruzado: `fechaFin >= fechaInicio`.
    - Auto-sugerencia de slug: `valueChanges` en `nombre` → transliterar acentos (`normalize('NFD').replace(/[̀-ͯ]/g, '')`), lowercase, reemplazar espacios y caracteres no `[a-z0-9]` por `-`, colapsar guiones múltiples, trim guiones inicio/fin, truncar a 50 chars. Solo auto-completar si el usuario no ha editado el slug manualmente (flag `slugManuallyEdited`).
    - Bloquear campo `slug` si `estado != 'Borrador'` en modo edición (usando `form.get('slug')?.disable()`).
    - Submit: distinguir modo con `this.id ? update(...) : create(...)`. Navegar a `/dashboard` tras éxito.
    - Errores de API: mostrar mensaje inline para 409 (slug duplicado) y 400 (fechas).

- [ ] **Tarea 14: Actualizar `app.routes.ts`**
  - Archivos: `admin/src/app/app.routes.ts`
  - Notas: Agregar dentro del bloque de rutas protegidas por `authGuard`:
    - `{ path: 'congreso/nuevo', canActivate: [authGuard], loadComponent: () => import('./congresos/congreso-form/congreso-form.component').then(m => m.CongresoFormComponent) }`
    - `{ path: 'congreso/:id/configuracion', canActivate: [authGuard], loadComponent: () => import('./congresos/congreso-form/congreso-form.component').then(m => m.CongresoFormComponent) }`

### Criterios de completitud técnica

El DEV puede considerar la historia técnicamente completa cuando:

- [ ] `dotnet build` sin warnings en `backend/`
- [ ] `dotnet ef migrations add AddConferencia` genera la migración con tabla, índices y FK correctos
- [ ] Todos los endpoints responden con los status codes especificados en el contrato API (sección 6)
- [ ] Ownership check funciona: un JWT de usuario A no puede leer, editar ni eliminar congresos de usuario B (retorna 404)
- [ ] El slug es validado server-side con regex `^[a-z0-9-]{3,50}$` independientemente del cliente
- [ ] La eliminación de un congreso en estado Publicado/Finalizado retorna 422
- [ ] `ng build` sin errores en `admin/`
- [ ] El formulario Angular bloquea el campo slug cuando el congreso está en estado distinto de Borrador
- [ ] No hay `console.error` sin capturar en los componentes Angular

---

## 5. Riesgos técnicos

| ID | Descripción | Probabilidad | Impacto | Mitigación propuesta |
|----|-------------|-------------|--------|---------------------|
| RT-2-01 | `DateOnly` en EF Core + Npgsql requiere configuración específica del driver. Sin `EnableLegacyTimestampBehavior` desactivado y Npgsql 8+, el mapeo `date` ↔ `DateOnly` puede fallar en runtime. | Baja | Alta | El DEV verifica que la versión de Npgsql en el proyecto es >= 8.0 (ya presente en US-1). Si hay problema, usar `DateTime` con `.Date` como fallback y documentar en `implementation-notes.md`. |
| RT-2-02 | La query de listado con `CantidadSesiones` (hardcoded a 0 ahora, COUNT real en US-5) puede requerir cambio de contrato del DTO cuando se agregue la tabla `sesiones`. | Baja | Baja | El campo ya existe en el DTO desde US-2; en US-5 solo se reemplaza el literal `0` por la subquery. Sin breaking change. |
| RT-2-03 | El `CongresoFormComponent` es el mismo componente para crear y editar. La carga condicional de datos (GET por id en modo edición) con signals y `ChangeDetectionStrategy.OnPush` puede generar ciclos de detección de cambios si no se maneja correctamente. | Media | Baja | Usar `toSignal(observable, { initialValue: null })` de `@angular/core/rxjs-interop` para evitar subscriptions manuales. El DEV prueba ambas rutas manualmente. |
| RT-2-04 | El cascade delete de EF Core (configurado con `DeleteBehavior.Cascade`) solo opera sobre entidades conocidas por el DbContext. Las tablas hijas de US-3, US-4, US-5 (salas, expositores, sesiones) que se agreguen posteriormente deben declarar su FK con `ON DELETE CASCADE` desde su propia migración. Si no lo hacen, el DELETE de una conferencia con entidades hijas fallará con error de FK violation. | Baja | Alta | Documentar en `implementation-notes.md` que cada historia que agregue entidades hijas de `Conferencia` DEBE declarar `OnDelete(DeleteBehavior.Cascade)` en su configuración. Esto es un requisito de diseño, no un riesgo de US-2. |

> RT-2-04 debe registrarse en `docs/risks/risk-register.md` como nota de diseño arquitectónico para US-3, US-4 y US-5.

---

## 6. Escalación arquitectónica

No aplica — la implementación es interna al módulo de congresos y sigue los patrones ya aprobados en ADR-001 y el baseline C4 de US-13.

---

## 7. Contrato API

### `GET /api/dashboard/conferencias`
- Auth: Bearer JWT requerido
- Response 200:
```json
[
  {
    "id": "uuid",
    "slug": "mi-congreso-2026",
    "nombre": "Mi Congreso 2026",
    "estado": "Borrador",
    "fechaInicio": "2026-09-01",
    "fechaFin": "2026-09-03",
    "cantidadSesiones": 0
  }
]
```

### `POST /api/dashboard/conferencias`
- Auth: Bearer JWT requerido
- Body:
```json
{
  "nombre": "Mi Congreso 2026",
  "slug": "mi-congreso-2026",
  "fechaInicio": "2026-09-01",
  "fechaFin": "2026-09-03",
  "descripcion": null,
  "logoUrl": null,
  "colorPrimario": null,
  "colorSecundario": null,
  "tipografia": null,
  "venueNombre": null,
  "venueDireccion": null,
  "venueLinkMaps": null
}
```
- Response 201: `ConferenciaDetalleDto` completo
- Response 400: campos obligatorios ausentes, fechas inconsistentes, slug con formato inválido
- Response 409: `{ "error": "SLUG_ALREADY_EXISTS", "message": "El slug ya está en uso." }`

### `GET /api/dashboard/conferencias/{id}`
- Auth: Bearer JWT requerido
- Response 200: `ConferenciaDetalleDto`
- Response 404: congreso no existe o no pertenece al usuario autenticado

### `PUT /api/dashboard/conferencias/{id}`
- Auth: Bearer JWT requerido
- Body: `UpdateConferenciaDto` (todos los campos opcionales)
- Response 200: `ConferenciaDetalleDto` actualizado
- Response 400: fechas inconsistentes o slug con formato inválido
- Response 404: ownership fallido
- Response 409: slug duplicado

### `DELETE /api/dashboard/conferencias/{id}`
- Auth: Bearer JWT requerido
- Response 204: eliminado correctamente
- Response 404: ownership fallido
- Response 422: `{ "error": "CANNOT_DELETE_NON_DRAFT", "message": "Solo se pueden eliminar congresos en estado Borrador." }`

---

## 8. Cambios en base de datos

### Nueva tabla: `conferencias`

| Columna | Tipo PG | Restricciones |
|---------|---------|--------------|
| `id` | `uuid` | PK, default `gen_random_uuid()` |
| `usuario_id` | `uuid` | FK → `usuarios(id)` ON DELETE CASCADE, NOT NULL |
| `slug` | `varchar(50)` | UNIQUE, NOT NULL |
| `nombre` | `varchar(255)` | NOT NULL |
| `descripcion` | `text` | nullable |
| `fecha_inicio` | `date` | NOT NULL |
| `fecha_fin` | `date` | NOT NULL |
| `estado` | `text` | NOT NULL, default `'Borrador'` |
| `logo_url` | `text` | nullable |
| `logo_secundario_url` | `text` | nullable |
| `banner_url` | `text` | nullable |
| `favicon_url` | `text` | nullable |
| `color_primario` | `varchar(7)` | nullable |
| `color_secundario` | `varchar(7)` | nullable |
| `tipografia` | `varchar(100)` | nullable |
| `venue_nombre` | `text` | nullable |
| `venue_direccion` | `text` | nullable |
| `venue_link_maps` | `text` | nullable |
| `created_at` | `timestamptz` | NOT NULL, default `NOW()` |

### Índices

| Nombre | Columnas | Tipo |
|--------|----------|------|
| `IX_conferencias_Slug` | `slug` | UNIQUE |
| `IX_conferencias_UsuarioId_Estado` | `(usuario_id, estado)` | Compuesto |

---

## 9. Checklist de seguridad

- [ ] `usuarioId` se extrae exclusivamente del claim `sub` del JWT — nunca del body de la request
- [ ] Todas las queries de escritura verifican `UsuarioId == usuarioId` del JWT antes de operar
- [ ] Slug validado server-side con `Regex.IsMatch(@"^[a-z0-9-]{3,50}$")` independientemente del cliente
- [ ] Respuesta 404 (no 403) cuando el congreso existe pero pertenece a otro usuario — no revelar existencia
- [ ] Cascade delete definido via `DeleteBehavior.Cascade` en FK, no en lógica de aplicación
- [ ] El campo `estado` del congreso nunca es modificable directamente por el cliente en US-2 (solo se fija en `Borrador` al crear; la transición de estado es scope de US-6)

---

## 10. Dependencias técnicas

- **US-1 completada**: JWT emitiendo claim `sub` con `usuario.Id.ToString()` — confirmado en `JwtService.cs`.
- **PostgreSQL con migración InitialCreate aplicada**: prerequisito para aplicar `AddConferencia`.
- Las tablas `salas`, `expositores`, `sesiones` (US-3, US-4, US-5) no existen aún. El campo `CantidadSesiones` en el listado devuelve `0` hasta que US-5 cree la tabla y el DEV de US-5 actualice la query de proyección.

---

## Aprobación

- [x] Preguntas funcionales resueltas — sin preguntas abiertas; el PO resolvió todos los riesgos funcionales el 2026-04-28
- [x] Escalación arquitectónica — no aplica
- [x] Plan aprobado por TL

**Aprobado por:** Technical Lead
**Fecha de aprobación:** 2026-04-28
