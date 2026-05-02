# Technical Plan — US-3: Gestionar salas de un congreso

**Fecha:** 2026-05-01
**Autor:** Technical Lead
**Story:** [US-3](./story.md)
**Estado:** Aprobado

---

## 1. Resumen del analisis

US-3 introduce la entidad `Sala` como primer hijo directo de `Conferencia`. El patron de implementacion es identico al establecido en US-2: modelo EF Core con Fluent API en `Data/Configurations/`, `ServiceResult<T>` para errores de dominio, controller `[Authorize]` con rutas anidadas bajo el recurso padre, y servicio Angular standalone con signals. No se introduce ningun patron nuevo ni decision arquitectonica no cubierta por los ADRs existentes.

El unico punto de atencion es el hook de "sala con sesiones": la tabla `sesiones` no existe en este sprint. La validacion de eliminacion se implementa con un COUNT que consulta `context.Sesiones` — pero como ese `DbSet` no existe aun, el COUNT se simula con un literal `0` (sin COUNT real) documentado en `implementation-notes.md`. El DEV de US-5 reemplazara el literal por la query real, identico al patron de `CantidadSesiones` en US-2. El `Conferencia` model no necesita modificacion: la propiedad de navegacion `ICollection<Sala>` no se agrega al modelo padre para evitar referencias cruzadas prematuras — EF Core resuelve la FK desde la configuracion de `Sala`.

---

## 2. Analisis de impacto

### Archivos y modulos afectados

| Archivo / Modulo | Tipo de cambio | Razon |
|-----------------|---------------|-------|
| `backend/Models/Sala.cs` | Creacion | Entidad de dominio nueva |
| `backend/Data/Configurations/SalaConfiguration.cs` | Creacion | Fluent API: FK, indices, restricciones |
| `backend/Data/AppDbContext.cs` | Modificacion | Agregar `DbSet<Sala>` y bloque `CreatedAt` en `SaveChangesAsync` |
| `backend/DTOs/Salas/CreateSalaDto.cs` | Creacion | DTO entrada POST |
| `backend/DTOs/Salas/UpdateSalaDto.cs` | Creacion | DTO entrada PUT |
| `backend/DTOs/Salas/SalaDto.cs` | Creacion | DTO salida (lista y detalle) |
| `backend/Services/SalaErrorCodes.cs` | Creacion | Constantes de error code |
| `backend/Services/ISalaService.cs` | Creacion | Interfaz del servicio |
| `backend/Services/SalaService.cs` | Creacion | Implementacion CRUD con ownership verificado |
| `backend/Controllers/SalasController.cs` | Creacion | Endpoints anidados bajo `/api/dashboard/conferencias/{conferenciaId}/salas` |
| `backend/Program.cs` | Modificacion | Registrar `ISalaService` en DI |
| `backend/Data/Migrations/{timestamp}_AddSala.cs` | Creacion | Migracion EF Core (generada) |
| `admin/src/app/salas/sala.model.ts` | Creacion | Interfaces TypeScript de DTOs |
| `admin/src/app/salas/sala.service.ts` | Creacion | Servicio HTTP Angular |
| `admin/src/app/salas/salas.component.ts` | Creacion | Componente lista + form inline |
| `admin/src/app/app.routes.ts` | Modificacion | Agregar ruta `/congreso/:id/salas` bajo `authGuard` |

### Impacto en otros modulos (regresion potencial)

| Modulo | Riesgo de regresion | Mitigacion |
|--------|--------------------|---------  |
| `AppDbContext` | Bajo — se agrega DbSet y bloque en SaveChangesAsync; no se toca logica existente | QAA verifica que el snapshot de migracion no rompe migraciones anteriores |
| `ConferenciaService` | Ninguno — no se modifica contrato ni implementacion | — |
| `ConferenciasController` | Ninguno — se agrega un controller nuevo con ruta diferente | — |
| `admin/app.routes.ts` | Bajo — se agrega ruta nueva con lazy loading; el redirect `**` permanece | QAA verifica que rutas existentes (login, dashboard, congreso/nuevo, congreso/:id/configuracion) siguen funcionando |
| `Conferencia.cs` (modelo) | Ninguno — NO se agrega navegacion `ICollection<Sala>` para evitar referencias prematuras | — |

### Impacto arquitectonico

- [x] **No** — implementacion interna al modulo de salas. El patron servicio + controller + EF Core ya esta establecido. No se introduce ningun nuevo contenedor C4 ni integracion externa.

---

## 3. Preguntas funcionales detectadas

Ninguna — la historia es suficientemente clara para implementacion. El comportamiento del hook de sesiones (COUNT = 0 hasta US-5) esta documentado en el mismo patron de US-2 y aceptado por la arquitectura del proyecto.

> Estado: Sin preguntas pendientes.

---

## 4. Plan de trabajo

### Enfoque tecnico

La implementacion replica el patron de US-2 sin desviaciones:

- **Modelo**: POCO `Sala` con `Guid Id`, `Guid ConferenciaId`, `string Nombre`, `int? Capacidad`, `DateTime CreatedAt`. Sin propiedad de navegacion `ICollection<>` en `Conferencia` — la FK se declara solo desde `SalaConfiguration`.
- **Configuracion Fluent API**: tabla `"salas"`, PK con `gen_random_uuid()`, FK hacia `conferencias` con `OnDelete(DeleteBehavior.Cascade)` (requerido por RT-2-04 del plan de US-2), indice unico compuesto `(conferencia_id, nombre)` para unicidad de nombre por congreso.
- **Servicio**: `SalaService` con `AppDbContext` inyectado. Todas las queries de lectura usan `AsNoTracking()`. La verificacion de ownership se hace via join con `Conferencias`: antes de operar sobre una sala, se verifica que `conferencias.usuario_id == usuarioId`. El hook de sesiones se implementa como comentario `// TODO US-5: reemplazar 0 por COUNT real` con literal `0`.
- **Controller**: rutas anidadas `[Route("api/dashboard/conferencias/{conferenciaId:guid}/salas")]`. El `conferenciaId` viene del path; `usuarioId` del claim `sub`. Todos los metodos verifican ownership via el servicio.
- **Angular**: carpeta `admin/src/app/salas/`. Componente standalone `SalasComponent` con `ChangeDetectionStrategy.OnPush`. Lista de salas con formulario inline para crear/editar (sin modal — mantener consistencia con el diseño minimalista del proyecto). `SalaService` con `HttpClient` inyectado.

### Tareas de implementacion

> Las ramas siguen el patron `feature/US-{N}-{short-title}` definido en `.claude/settings.json`. El DEV opera en rama `feature/US-3-gestionar-salas`. Como `pipeline.devPlanReview` es `false` en el `settings.json` actual, el DEV puede proceder directamente a implementar sin producir un plan intermedio.

#### Backend

- [ ] **Tarea 1: Modelo `Sala`**
  - Archivo: `backend/Models/Sala.cs`
  - Notas: `Guid Id`, `Guid ConferenciaId`, `string Nombre` (not null), `int? Capacidad`, `DateTime CreatedAt`. Propiedad de navegacion `Conferencia Conferencia` (requerida por EF Core para el `HasOne`). Sin `ICollection<>` en `Conferencia.cs` — no tocar ese archivo.

- [ ] **Tarea 2: `SalaConfiguration` (Fluent API)**
  - Archivo: `backend/Data/Configurations/SalaConfiguration.cs`
  - Notas:
    - Tabla: `"salas"`
    - PK: `HasDefaultValueSql("gen_random_uuid()")`
    - `Nombre`: `IsRequired()`, `HasMaxLength(100)`
    - `Capacidad`: nullable (sin restriccion de longitud, columna `integer` por defecto EF Core)
    - `CreatedAt`: `HasColumnType("timestamptz")`, `HasDefaultValueSql("NOW()")`, `ValueGeneratedOnAdd()`
    - FK: `HasOne(s => s.Conferencia).WithMany().HasForeignKey(s => s.ConferenciaId).OnDelete(DeleteBehavior.Cascade)` — obligatorio por RT-2-04
    - Indice unico compuesto: `HasIndex(s => new { s.ConferenciaId, s.Nombre }).IsUnique()` — garantiza unicidad de nombre dentro del congreso

- [ ] **Tarea 3: Actualizar `AppDbContext`**
  - Archivo: `backend/Data/AppDbContext.cs`
  - Notas: Agregar `public DbSet<Sala> Salas => Set<Sala>();`. Agregar bloque en `SaveChangesAsync` para poblar `CreatedAt` en entradas `Sala` con estado `Added`, identico a los bloques existentes de `Usuario`, `RefreshToken` y `Conferencia`.

- [ ] **Tarea 4: DTOs de Sala**
  - Archivos: `backend/DTOs/Salas/CreateSalaDto.cs`, `backend/DTOs/Salas/UpdateSalaDto.cs`, `backend/DTOs/Salas/SalaDto.cs`
  - Notas:
    - `CreateSalaDto`: `Nombre` required con `[Required]` y `[MaxLength(100)]`; `Capacidad` nullable `int?` con `[Range(1, int.MaxValue, ErrorMessage = "La capacidad debe ser un entero positivo.")]`.
    - `UpdateSalaDto`: mismos campos que `CreateSalaDto` pero ambos nullable (`string? Nombre`, `int? Capacidad`). `Nombre` con `[MaxLength(100)]` si no es null; `Capacidad` con `[Range(1, int.MaxValue)]` si no es null.
    - `SalaDto`: `Guid Id`, `string Nombre`, `int? Capacidad`, `DateTime CreadoEn`. No exponer `ConferenciaId` (ya esta en el path).

- [ ] **Tarea 5: `SalaErrorCodes` e `ISalaService`**
  - Archivos: `backend/Services/SalaErrorCodes.cs`, `backend/Services/ISalaService.cs`
  - Notas — error codes: `ConferenciaNotFound` (ownership fallo o congreso no existe), `SalaNotFound`, `NombreAlreadyExists` (nombre duplicado en el congreso), `CannotDeleteWithSesiones` (sala tiene sesiones — para el hook US-5), `CapacidadInvalid`.
  - Interfaz: `GetBySalasByConferenciaAsync(Guid conferenciaId, Guid usuarioId)`, `GetByIdAsync(Guid id, Guid conferenciaId, Guid usuarioId)`, `CreateAsync(CreateSalaDto dto, Guid conferenciaId, Guid usuarioId)`, `UpdateAsync(Guid id, UpdateSalaDto dto, Guid conferenciaId, Guid usuarioId)`, `DeleteAsync(Guid id, Guid conferenciaId, Guid usuarioId)`.

- [ ] **Tarea 6: `SalaService`**
  - Archivo: `backend/Services/SalaService.cs`
  - Notas:
    - **Verificacion de ownership** (helper privado): `await context.Conferencias.AsNoTracking().AnyAsync(c => c.Id == conferenciaId && c.UsuarioId == usuarioId)`. Si false → retornar `Fail(SalaErrorCodes.ConferenciaNotFound, ...)`. Usar en todos los metodos antes de operar.
    - `GetSalasByConferenciaAsync`: verificar ownership, luego `context.Salas.AsNoTracking().Where(s => s.ConferenciaId == conferenciaId).OrderBy(s => s.Nombre).Select(s => new SalaDto {...}).ToListAsync()`.
    - `GetByIdAsync`: verificar ownership, luego `FirstOrDefaultAsync(s => s.Id == id && s.ConferenciaId == conferenciaId)`. Si null → retornar null (controller responde 404).
    - `CreateAsync`: (1) verificar ownership; (2) validar unicidad de nombre: `AnyAsync(s => s.ConferenciaId == conferenciaId && s.Nombre == dto.Nombre)` → `Fail(SalaErrorCodes.NombreAlreadyExists)`; (3) crear y persistir.
    - `UpdateAsync`: (1) verificar ownership; (2) obtener sala con tracking (`FirstOrDefaultAsync(s => s.Id == id && s.ConferenciaId == conferenciaId)`); (3) si se cambia el nombre, verificar unicidad excluyendo el propio id; (4) aplicar cambios y `SaveChangesAsync`.
    - `DeleteAsync`: (1) verificar ownership; (2) obtener sala con tracking; (3) verificar que no tiene sesiones: `var tieneSesiones = false; // TODO US-5: reemplazar por await context.Sesiones.AnyAsync(ses => ses.SalaId == id)` → si true `Fail(SalaErrorCodes.CannotDeleteWithSesiones)`; (4) `context.Salas.Remove(sala)` + `SaveChangesAsync`.

- [ ] **Tarea 7: `SalasController`**
  - Archivo: `backend/Controllers/SalasController.cs`
  - Notas:
    - `[ApiController]`, `[Authorize]`, `[Route("api/dashboard/conferencias/{conferenciaId:guid}/salas")]`
    - `UsuarioId`: `Guid.Parse(User.FindFirstValue(JwtRegisteredClaimNames.Sub)!)`
    - `GET /` → 200 con `IEnumerable<SalaDto>` o 404 si congreso no existe/no pertenece.
    - `POST /` → 201 con `SalaDto`; errores: `ConferenciaNotFound` → 404, `NombreAlreadyExists` → 409, `CapacidadInvalid` → 400.
    - `GET /{id}` → 200 con `SalaDto` o 404.
    - `PUT /{id}` → 200 con `SalaDto`; errores: `SalaNotFound` → 404, `NombreAlreadyExists` → 409.
    - `DELETE /{id}` → 204; errores: `SalaNotFound` → 404, `CannotDeleteWithSesiones` → 422.
    - Para 422 usar `StatusCode(422, new { error = result.ErrorCode, message = result.ErrorMessage })`.
    - POST retorna `CreatedAtAction(nameof(GetSala), new { conferenciaId, id = result.Data!.Id }, result.Data)`.

- [ ] **Tarea 8: Registro DI en `Program.cs`**
  - Archivo: `backend/Program.cs`
  - Notas: Agregar `builder.Services.AddScoped<ISalaService, SalaService>();` junto a los demas `AddScoped` existentes.

- [ ] **Tarea 9: Migracion EF Core**
  - Archivo: `backend/Data/Migrations/{timestamp}_AddSala.cs` (generado)
  - Notas: Ejecutar `dotnet ef migrations add AddSala` desde `backend/`. Verificar que la migracion generada incluye: tabla `salas`, columnas `id` (uuid, PK), `conferencia_id` (uuid, FK con ON DELETE CASCADE), `nombre` (varchar(100), NOT NULL), `capacidad` (integer, nullable), `created_at` (timestamptz, default NOW()), indice unico `(conferencia_id, nombre)`. Documentar en `implementation-notes.md` si no hay PostgreSQL local para ejecutar `database update`.

#### Angular

- [ ] **Tarea 10: Interfaces TypeScript `sala.model.ts`**
  - Archivo: `admin/src/app/salas/sala.model.ts`
  - Notas:
    ```typescript
    export interface SalaDto { id: string; nombre: string; capacidad: number | null; creadoEn: string; }
    export interface CreateSalaDto { nombre: string; capacidad?: number; }
    export interface UpdateSalaDto { nombre?: string; capacidad?: number; }
    ```

- [ ] **Tarea 11: `SalaService`**
  - Archivo: `admin/src/app/salas/sala.service.ts`
  - Notas: `@Injectable({ providedIn: 'root' })`. URL base: `${environment.apiUrl}/api/dashboard/conferencias`. Metodos:
    - `getSalas(conferenciaId: string): Observable<SalaDto[]>` → GET `/{conferenciaId}/salas`
    - `create(conferenciaId: string, dto: CreateSalaDto): Observable<SalaDto>` → POST `/{conferenciaId}/salas`
    - `update(conferenciaId: string, id: string, dto: UpdateSalaDto): Observable<SalaDto>` → PUT `/{conferenciaId}/salas/{id}`
    - `delete(conferenciaId: string, id: string): Observable<void>` → DELETE `/{conferenciaId}/salas/{id}`

- [ ] **Tarea 12: `SalasComponent`**
  - Archivo: `admin/src/app/salas/salas.component.ts`
  - Notas:
    - `standalone: true`, `ChangeDetectionStrategy.OnPush`, importa `CommonModule`, `ReactiveFormsModule`, `RouterLink`.
    - Lee `conferenciaId` de `ActivatedRoute.snapshot.paramMap.get('id')`.
    - En `ngOnInit`: carga salas via `salaService.getSalas(conferenciaId)` y setea signal `salas = signal<SalaDto[]>([])`.
    - **Form inline** (no modal): un `ReactiveForm` con campos `nombre` (required, maxlength 100) y `capacidad` (opcional, min 1). El mismo form sirve para crear y editar: cuando el usuario hace clic en "Editar" de una fila, se parchea el form con los datos de esa sala y se guarda el `id` en `editingId = signal<string | null>(null)`.
    - Submit: si `editingId()` es null → `salaService.create(...)`, si no → `salaService.update(...)`. Tras exito, recargar lista y resetear form.
    - Boton "Eliminar" en cada fila: llama `salaService.delete(...)`. Si el backend retorna 422 (`CANNOT_DELETE_WITH_SESIONES`) mostrar mensaje inline "No se puede eliminar una sala con sesiones asignadas."
    - Error 409 (`NOMBRE_ALREADY_EXISTS`) en submit: mostrar error inline en el campo nombre.
    - Señal `loading = signal(false)`, `submitting = signal(false)`.
    - Boton "Volver" → `routerLink="/dashboard"`.

- [ ] **Tarea 13: Actualizar `app.routes.ts`**
  - Archivo: `admin/src/app/app.routes.ts`
  - Notas: Agregar antes del catch-all `**`:
    ```typescript
    {
      path: 'congreso/:id/salas',
      canActivate: [authGuard],
      loadComponent: () => import('./salas/salas.component').then(m => m.SalasComponent)
    }
    ```
  - El `DashboardComponent` ya tiene boton "Gestionar" que navega a `/congreso/:id/configuracion`. El DEV debe agregar un enlace adicional "Salas" por cada congreso en la tabla del dashboard que navegue a `/congreso/:id/salas`. Modificar `dashboard.component.ts` para agregar la columna/accion.

### Criterios de completitud tecnica

El DEV puede considerar la historia tecnicamente completa cuando:

- [ ] `dotnet build` sin warnings en `backend/`
- [ ] La migracion `AddSala` genera tabla con FK `ON DELETE CASCADE` hacia `conferencias`, indice unico `(conferencia_id, nombre)` y columnas correctas
- [ ] `GET /api/dashboard/conferencias/{conferenciaId}/salas` retorna 404 si el congreso no pertenece al usuario autenticado
- [ ] `POST` con nombre duplicado dentro del mismo congreso retorna 409
- [ ] `POST` con capacidad negativa o cero retorna 400
- [ ] `DELETE` de una sala retorna 204 (el hook de sesiones siempre pasa en US-3 porque la tabla no existe)
- [ ] El literal `// TODO US-5` esta presente en el codigo del hook de sesiones en `SalaService.DeleteAsync`
- [ ] `ng build` sin errores en `admin/`
- [ ] El componente `SalasComponent` carga correctamente para `/congreso/:id/salas` y el `conferenciaId` se extrae del parametro de ruta
- [ ] No hay `console.error` sin capturar en componentes Angular

---

## 5. Riesgos tecnicos

| ID | Descripcion | Probabilidad | Impacto | Mitigacion propuesta |
|----|-------------|-------------|--------|---------------------|
| RT-3-01 | El indice unico `(conferencia_id, nombre)` puede generar errores de constraint poco descriptivos si EF Core no mapea bien la exception de Npgsql a un `ServiceResult` legible. Si no se captura la excepcion de BD, el controller devuelve 500 en vez de 409. | Media | Media | El `SalaService.CreateAsync` y `UpdateAsync` deben verificar unicidad via `AnyAsync` **antes** de intentar la escritura, mismo patron que `ConferenciaService` con el slug. Nunca depender de catch de excepcion de BD para logica de negocio. |
| RT-3-02 | El hook de sesiones (`tieneSesiones = false` literal) puede olvidarse de actualizar en US-5 si no queda bien documentado. | Baja | Media | El comentario `// TODO US-5` en `SalaService.DeleteAsync` es obligatorio. Ademas, documentar en `implementation-notes.md` la lista de todos los TODOs pendientes para US-5, igual que el patron de `CantidadSesiones` en US-2. |
| RT-3-03 | El `SalasComponent` usa un form inline (no modal). Con `ChangeDetectionStrategy.OnPush`, la actualizacion del signal `editingId` y el parcheo del form deben disparar deteccion de cambios correctamente. Si se usa `patchValue` sin `markForCheck`, el template puede no refrescarse. | Baja | Baja | El DEV debe llamar `this.cdr.markForCheck()` (inyectando `ChangeDetectorRef`) despues de `patchValue` en modo edicion, o usar `toSignal` para la carga inicial. Probar manualmente el flujo crear → editar → cancelar. |

---

## 6. Escalacion arquitectonica

No aplica.

---

## 7. Dependencias tecnicas

- **US-2 completada y migracion `AddConferencia` aplicada**: la tabla `conferencias` debe existir en la BD antes de aplicar `AddSala` (FK constraint).
- **JWT con claim `sub`**: ya emitido correctamente por `JwtService` desde US-1. No hay cambios requeridos en autenticacion.
- La tabla `sesiones` (US-5) no existe. El hook de eliminacion devuelve siempre `false` (sala eliminable) hasta que US-5 cree la tabla y actualice `SalaService.DeleteAsync`.

---

## Contrato API

### `GET /api/dashboard/conferencias/{conferenciaId}/salas`
- Auth: Bearer JWT requerido
- Response 200:
```json
[
  { "id": "uuid", "nombre": "Sala Principal", "capacidad": 300, "creadoEn": "2026-05-01T..." },
  { "id": "uuid", "nombre": "Sala Taller", "capacidad": null, "creadoEn": "2026-05-01T..." }
]
```
- Response 404: congreso no existe o no pertenece al usuario

### `POST /api/dashboard/conferencias/{conferenciaId}/salas`
- Auth: Bearer JWT requerido
- Body: `{ "nombre": "Sala Principal", "capacidad": 300 }`
- Response 201: `SalaDto`
- Response 400: capacidad invalida (cero o negativa)
- Response 404: congreso no pertenece al usuario
- Response 409: `{ "error": "NOMBRE_ALREADY_EXISTS", "message": "Ya existe una sala con ese nombre en este congreso." }`

### `PUT /api/dashboard/conferencias/{conferenciaId}/salas/{id}`
- Auth: Bearer JWT requerido
- Body: `{ "nombre": "Nuevo Nombre", "capacidad": 150 }` (campos opcionales)
- Response 200: `SalaDto` actualizado
- Response 404: sala o congreso no encontrado / no pertenece al usuario
- Response 409: nombre duplicado

### `DELETE /api/dashboard/conferencias/{conferenciaId}/salas/{id}`
- Auth: Bearer JWT requerido
- Response 204: eliminada correctamente
- Response 404: sala o congreso no encontrado
- Response 422: `{ "error": "CANNOT_DELETE_WITH_SESIONES", "message": "No se puede eliminar una sala con sesiones asignadas." }`

---

## Cambios en base de datos

### Nueva tabla: `salas`

| Columna | Tipo PG | Restricciones |
|---------|---------|--------------|
| `id` | `uuid` | PK, default `gen_random_uuid()` |
| `conferencia_id` | `uuid` | FK → `conferencias(id)` ON DELETE CASCADE, NOT NULL |
| `nombre` | `varchar(100)` | NOT NULL |
| `capacidad` | `integer` | nullable |
| `created_at` | `timestamptz` | NOT NULL, default `NOW()` |

### Indices

| Nombre | Columnas | Tipo |
|--------|----------|------|
| `IX_salas_ConferenciaId_Nombre` | `(conferencia_id, nombre)` | UNIQUE |

---

## Aprobacion

- [x] Preguntas funcionales resueltas — sin preguntas abiertas
- [x] Escalacion arquitectonica — no aplica
- [x] Plan aprobado por TL

**Aprobado por:** Technical Lead
**Fecha de aprobacion:** 2026-05-01
