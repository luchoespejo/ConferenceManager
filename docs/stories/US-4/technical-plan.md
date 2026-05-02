# Technical Plan — US-4: Gestionar expositores de un congreso

**Date:** 2026-05-01
**Author:** Technical Lead
**Story:** [US-4](./story.md)
**Status:** Approved

---

## 1. Resumen de análisis

US-4 introduce la entidad `Expositor`, hija directa de `Conferencia`. Repite exactamente el patrón establecido en US-2: modelo EF Core con Fluent API en `Data/Configurations/`, `ServiceResult<T>` para errores de dominio, controller `[Authorize]` con extracción de `usuarioId` desde el claim `sub`, y servicio Angular `@Injectable({ providedIn: 'root' })` con signals en el componente. No hay ninguna integración nueva ni decisión arquitectónica pendiente.

La única particularidad técnica respecto a US-2 es el campo `RedesSociales` como `JsonDocument?` (tipo `jsonb` en PostgreSQL). Npgsql 10.0.1 soporta `JsonDocument` nativamente con `HasColumnType("jsonb")` en Fluent API — no requiere conversión manual ni paquete adicional. El `TokenAcceso` se genera en el servicio con `Guid.NewGuid().ToString()` en el momento de la creación y nunca se expone en el listado (solo en el detalle). La verificación de ownership del congreso se hace en todas las operaciones para cumplir el requisito de multitenancy.

---

## 2. Análisis de impacto

### Archivos y módulos afectados

| Archivo / Módulo | Tipo de cambio | Razón |
|-----------------|---------------|-------|
| `backend/Models/Expositor.cs` | Creación | Entidad de dominio nueva |
| `backend/Data/Configurations/ExpositorConfiguration.cs` | Creación | Fluent API: tabla, FK, índices, jsonb |
| `backend/Data/AppDbContext.cs` | Modificación | Agregar `DbSet<Expositor>` y bloque `CreatedAt` en `SaveChangesAsync` |
| `backend/DTOs/Expositores/CreateExpositorDto.cs` | Creación | DTO de entrada para POST |
| `backend/DTOs/Expositores/UpdateExpositorDto.cs` | Creación | DTO de entrada para PUT |
| `backend/DTOs/Expositores/ExpositorListItemDto.cs` | Creación | DTO de salida para listado (sin TokenAcceso) |
| `backend/DTOs/Expositores/ExpositorDetalleDto.cs` | Creación | DTO de salida completo (con TokenAcceso) |
| `backend/Services/ExpositorErrorCodes.cs` | Creación | Constantes de error code del dominio |
| `backend/Services/IExpositorService.cs` | Creación | Interfaz del servicio |
| `backend/Services/ExpositorService.cs` | Creación | Implementación: CRUD + validaciones |
| `backend/Controllers/ExpositoresController.cs` | Creación | Endpoints bajo `/api/dashboard/conferencias/{conferenciaId}/expositores` |
| `backend/Data/Migrations/{timestamp}_AddExpositor.cs` | Creación | Migración EF Core (generada por CLI) |
| `backend/Program.cs` | Modificación | Registrar `IExpositorService` en DI |
| `admin/src/app/expositores/expositor.model.ts` | Creación | Interfaces TypeScript de DTOs |
| `admin/src/app/expositores/expositor.service.ts` | Creación | Servicio HTTP Angular |
| `admin/src/app/expositores/expositores.component.ts` | Creación | Componente lista + form inline o modal |
| `admin/src/app/app.routes.ts` | Modificación | Agregar ruta `/congreso/:id/expositores` |

### Impacto en otros módulos (regresión potencial)

| Módulo | Riesgo de regresión | Mitigación |
|--------|--------------------|-----------| 
| `AppDbContext` | Bajo — se agrega `DbSet<Expositor>` y bloque `CreatedAt`; no se toca lógica existente | QAA verifica que el snapshot de migración no rompe migraciones anteriores |
| `ConferenciaConfiguration` | Ninguno — se agrega propiedad de navegación `Expositores` en `Conferencia.cs` solamente si se quiere cargar la colección; la FK se declara en `ExpositorConfiguration`. No es necesario para US-4 | No modificar `ConferenciaConfiguration.cs` |
| `ConferenciasController` | Ninguno — no se modifica ningún endpoint existente | — |
| `admin/app.routes.ts` | Bajo — se agrega una ruta nueva; el wildcard `**` y rutas existentes permanecen | QAA verifica que dashboard, login y rutas de congreso actuales siguen funcionando |

### Impacto arquitectónico

- [x] **No** — la implementación es interna al módulo de expositores. El patrón de entidad hija de Conferencia, su FK con cascade delete, y los endpoints de dashboard ya están establecidos en US-2. No se introduce ningún nuevo contenedor C4 ni integración externa.

---

## 3. Preguntas funcionales detectadas

Ninguna — la historia está suficientemente clara. Los campos, restricciones, comportamiento de ownership y el placeholder de la validación de sesiones (US-5) están todos especificados.

> Estado: No hay preguntas pendientes.

---

## 4. Plan de trabajo

### Enfoque técnico

La implementación sigue el patrón establecido en US-2 sin desviaciones:

- **Modelo**: clase POCO `Expositor` con propiedad `JsonDocument? RedesSociales` para el campo JSONB. Npgsql 10 mapea `JsonDocument` ↔ `jsonb` de forma nativa con `HasColumnType("jsonb")` en Fluent API — no requiere `HasConversion` ni valor por defecto.
- **TokenAcceso**: generado en `ExpositorService.CreateAsync` como `Guid.NewGuid().ToString()` (formato `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`, 36 caracteres). Se persiste como `varchar(36)` con índice único global. No se expone en `ExpositorListItemDto`; sí en `ExpositorDetalleDto`.
- **Ownership**: el servicio verifica ownership del congreso en cada operación — primero busca la conferencia con `context.Conferencias.AnyAsync(c => c.Id == conferenciaId && c.UsuarioId == usuarioId)`. Si el congreso no pertenece al usuario, retorna `Fail(ConferenciaNoPertenece)` → controller responde 404 (no revelar existencia).
- **Email**: validado en el DTO de entrada con `[EmailAddress]` de `System.ComponentModel.DataAnnotations`. El `[ApiController]` attribute devuelve 400 automáticamente si falla.
- **RedesSociales en DTOs**: el DTO de entrada recibe un `Dictionary<string, string>?` (más ergonómico para el cliente Angular). El servicio convierte a `JsonDocument` antes de persistir usando `JsonSerializer.SerializeToDocument(dto.RedesSociales)`. El DTO de salida expone `Dictionary<string, string>?` deserializado desde el `JsonDocument` almacenado.
- **Validación sesiones (US-5)**: el método `DeleteAsync` incluye un comentario que señala el punto de inserción para la validación futura. Por ahora siempre permite eliminar (no existe tabla `sesiones`).
- **Angular**: el componente `ExpositoresComponent` es standalone, `ChangeDetectionStrategy.OnPush`, gestiona la lista y el formulario (modo lista/modo edición con un flag de signal). Mismo patrón que `DashboardComponent` y `CongresoFormComponent`.

### Tareas de implementación

> Las ramas siguen el patrón `feature/US-{N}-{short-title}` definido en `.claude/settings.json`. El DEV opera en una rama nueva `feature/US-4-gestionar-expositores` creada desde `main`. Como `pipeline.devPlanReview` es `false`, el DEV implementa directamente sin plan previo.

#### Backend

- [ ] **Tarea 1: Modelo `Expositor`**
  - Archivos: `backend/Models/Expositor.cs`
  - Notas: Propiedades: `Guid Id`, `Guid ConferenciaId`, `string Nombre`, `string? Bio`, `string? FotoUrl`, `string? Email`, `System.Text.Json.JsonDocument? RedesSociales`, `string TokenAcceso`, `DateTime CreatedAt`. Propiedad de navegación: `Conferencia Conferencia`. NO agregar `ICollection<Sesion>` (US-5 lo declarará). Incluir `using System.Text.Json;` en el archivo.

- [ ] **Tarea 2: `ExpositorConfiguration` (Fluent API)**
  - Archivos: `backend/Data/Configurations/ExpositorConfiguration.cs`
  - Notas:
    - Tabla: `"expositores"`
    - PK: `HasDefaultValueSql("gen_random_uuid()")`
    - `Nombre`: `IsRequired()`, `HasMaxLength(255)`
    - `Bio`: `HasColumnType("text")`
    - `FotoUrl`: `HasColumnType("text")`
    - `Email`: `HasMaxLength(254)`
    - `RedesSociales`: `HasColumnType("jsonb")`
    - `TokenAcceso`: `IsRequired()`, `HasMaxLength(36)`, `HasIndex(...).IsUnique()` (índice único global)
    - `CreatedAt`: `HasColumnType("timestamptz")`, `HasDefaultValueSql("NOW()")`, `ValueGeneratedOnAdd()`
    - FK: `HasOne(e => e.Conferencia).WithMany().HasForeignKey(e => e.ConferenciaId).OnDelete(DeleteBehavior.Cascade)`
    - Índice adicional: `HasIndex(e => e.ConferenciaId)` (para queries filtradas por congreso)

- [ ] **Tarea 3: Actualizar `AppDbContext`**
  - Archivos: `backend/Data/AppDbContext.cs`
  - Notas: Agregar `public DbSet<Expositor> Expositores => Set<Expositor>();`. Agregar bloque en `SaveChangesAsync` para poblar `CreatedAt` en entradas `Expositor` con estado `Added`, igual al bloque de `Conferencia`. Agregar `using ConferenceManager.Models;` si no está ya globalmente disponible (está en implicit usings).

- [ ] **Tarea 4: DTOs de Expositor**
  - Archivos: `backend/DTOs/Expositores/CreateExpositorDto.cs`, `UpdateExpositorDto.cs`, `ExpositorListItemDto.cs`, `ExpositorDetalleDto.cs`
  - Notas:
    - `CreateExpositorDto`: `string Nombre` (required, MaxLength 255), `string? Bio`, `string? FotoUrl`, `string? Email` ([EmailAddress], MaxLength 254), `Dictionary<string, string>? RedesSociales`.
    - `UpdateExpositorDto`: todos los campos de `CreateExpositorDto` como nullable (excepto `Nombre` que sigue siendo required). Patrón idéntico a `UpdateConferenciaDto`.
    - `ExpositorListItemDto`: `Guid Id`, `string Nombre`, `string? Bio`, `string? FotoUrl`, `string? Email`, `Dictionary<string, string>? RedesSociales`, `DateTime CreadoEn`. SIN `TokenAcceso`.
    - `ExpositorDetalleDto`: igual a `ExpositorListItemDto` pero AGREGA `string TokenAcceso`.
    - Para la conversión `JsonDocument? → Dictionary<string, string>?`: usar `JsonSerializer.Deserialize<Dictionary<string, string>>(doc.RootElement.GetRawText())` en el método `MapTo*Dto` del servicio.

- [ ] **Tarea 5: `ExpositorErrorCodes` y `IExpositorService`**
  - Archivos: `backend/Services/ExpositorErrorCodes.cs`, `backend/Services/IExpositorService.cs`
  - Notas:
    - Error codes: `ConferenciaNotFound` (congreso no existe o no pertenece al usuario), `ExpositorNotFound`, `TokenAccesoCollision` (rarísimo, Guid.NewGuid colisiona con uno existente — manejo defensivo).
    - `IExpositorService`:
      ```
      Task<IEnumerable<ExpositorListItemDto>> GetAllAsync(Guid conferenciaId, Guid usuarioId);
      Task<ExpositorDetalleDto?> GetByIdAsync(Guid id, Guid conferenciaId, Guid usuarioId);
      Task<ServiceResult<ExpositorDetalleDto>> CreateAsync(CreateExpositorDto dto, Guid conferenciaId, Guid usuarioId);
      Task<ServiceResult<ExpositorDetalleDto>> UpdateAsync(Guid id, UpdateExpositorDto dto, Guid conferenciaId, Guid usuarioId);
      Task<ServiceResult> DeleteAsync(Guid id, Guid conferenciaId, Guid usuarioId);
      ```

- [ ] **Tarea 6: `ExpositorService`**
  - Archivos: `backend/Services/ExpositorService.cs`
  - Notas:
    - Helper privado `VerifyOwnershipAsync(Guid conferenciaId, Guid usuarioId)`: `context.Conferencias.AsNoTracking().AnyAsync(c => c.Id == conferenciaId && c.UsuarioId == usuarioId)`. Retorna `bool`. Si `false`, el llamador retorna `Fail(ExpositorErrorCodes.ConferenciaNotFound)`.
    - `GetAllAsync`: verificar ownership → query `context.Expositores.AsNoTracking().Where(e => e.ConferenciaId == conferenciaId).OrderBy(e => e.Nombre)` → proyectar a `ExpositorListItemDto`.
    - `GetByIdAsync`: verificar ownership → buscar `FirstOrDefaultAsync(e => e.Id == id && e.ConferenciaId == conferenciaId)` con `AsNoTracking()`. Retornar `null` si no existe → controller responde 404.
    - `CreateAsync`: (1) verificar ownership; (2) generar `tokenAcceso = Guid.NewGuid().ToString()`; (3) verificar unicidad del token: `AnyAsync(e => e.TokenAcceso == tokenAcceso)` — si colisiona (extremadamente improbable), retornar `Fail(TokenAccesoCollision)` — controller responde 500; (4) crear y persistir; (5) retornar `Ok(MapToDetalleDto(expositor))`.
    - `UpdateAsync`: (1) verificar ownership; (2) buscar expositor con tracking `FirstOrDefaultAsync(e => e.Id == id && e.ConferenciaId == conferenciaId)`; si `null` → `Fail(ExpositorNotFound)`; (3) aplicar campos no-null del DTO; (4) para `RedesSociales`: si `dto.RedesSociales is not null`, serializar a `JsonDocument` con `JsonSerializer.SerializeToDocument(dto.RedesSociales)`; (5) `SaveChangesAsync`.
    - `DeleteAsync`: (1) verificar ownership; (2) buscar expositor con tracking; si `null` → `Fail(ExpositorNotFound)`; (3) **TODO US-5**: verificar que el expositor no tenga sesiones asignadas antes de eliminar; (4) `context.Expositores.Remove(expositor)` → `SaveChangesAsync`.
    - Conversión JSONB para DTOs de salida: método privado estático `MapRedesSociales(JsonDocument? doc)`:
      ```csharp
      if (doc is null) return null;
      return JsonSerializer.Deserialize<Dictionary<string, string>>(doc.RootElement.GetRawText());
      ```

- [ ] **Tarea 7: `ExpositoresController`**
  - Archivos: `backend/Controllers/ExpositoresController.cs`
  - Notas:
    - `[ApiController]`, `[Authorize]`, `[Route("api/dashboard/conferencias/{conferenciaId:guid}/expositores")]`
    - Constructor inyecta `IExpositorService`.
    - Helper privado: `Guid UsuarioId => Guid.Parse(User.FindFirstValue(JwtRegisteredClaimNames.Sub)!);`
    - `GET /` → `GetAllAsync(conferenciaId, UsuarioId)` → 200. Si `ConferenciaNotFound` → 404.
    - `POST /` → `CreateAsync(dto, conferenciaId, UsuarioId)` → 201 con `ExpositorDetalleDto`. Errores: `ConferenciaNotFound` → 404; `TokenAccesoCollision` → 500.
    - `GET /{id:guid}` → `GetByIdAsync(id, conferenciaId, UsuarioId)` → 200 o 404.
    - `PUT /{id:guid}` → `UpdateAsync(id, dto, conferenciaId, UsuarioId)` → 200 o 404.
    - `DELETE /{id:guid}` → `DeleteAsync(id, conferenciaId, UsuarioId)` → 204; `ExpositorNotFound` → 404; `ConferenciaNotFound` → 404; `TieneSessionesAsignadas` (US-5) → 422.
    - Para `GetAll`: si ownership falla, el servicio retorna una colección vacía no es correcto — ver nota abajo. El `GetAllAsync` debe retornar `ServiceResult<IEnumerable<ExpositorListItemDto>>` para poder distinguir "congreso no existe/no pertenece" de "congreso sin expositores". **Ajuste al contrato de `IExpositorService`**: `GetAllAsync` retorna `ServiceResult<IEnumerable<ExpositorListItemDto>>` en lugar de `IEnumerable<ExpositorListItemDto>`.

- [ ] **Tarea 8: Registro DI en `Program.cs`**
  - Archivos: `backend/Program.cs`
  - Notas: Agregar `builder.Services.AddScoped<IExpositorService, ExpositorService>();` junto a los demás `AddScoped`.

- [ ] **Tarea 9: Migración EF Core**
  - Archivos: `backend/Data/Migrations/{timestamp}_AddExpositor.cs` (generado por CLI)
  - Notas: Ejecutar `dotnet ef migrations add AddExpositor` desde `backend/`. Verificar en la migración generada: tabla `expositores`, columna `redes_sociales` con tipo `jsonb`, columna `token_acceso` con índice único, columna `conferencia_id` con FK `ON DELETE CASCADE`, índice en `conferencia_id`. No ejecutar `database update` si no hay PostgreSQL local — documentar en `implementation-notes.md`.

#### Angular

- [ ] **Tarea 10: Interfaces TypeScript `expositor.model.ts`**
  - Archivos: `admin/src/app/expositores/expositor.model.ts`
  - Notas:
    - `RedesSociales`: `{ twitter?: string; linkedin?: string; web?: string; [key: string]: string | undefined }` (extensible).
    - `ExpositorListItemDto`: `id`, `nombre`, `bio?`, `fotoUrl?`, `email?`, `redesSociales?`, `creadoEn`. SIN `tokenAcceso`.
    - `ExpositorDetalleDto`: igual a `ExpositorListItemDto` + `tokenAcceso: string`.
    - `CreateExpositorDto`: `nombre` (required), `bio?`, `fotoUrl?`, `email?`, `redesSociales?`.
    - `UpdateExpositorDto`: `Partial<CreateExpositorDto>`.

- [ ] **Tarea 11: `ExpositorService` Angular**
  - Archivos: `admin/src/app/expositores/expositor.service.ts`
  - Notas: `@Injectable({ providedIn: 'root' })`. URL base: `${environment.apiUrl}/api/dashboard/conferencias/{conferenciaId}/expositores` — el `conferenciaId` se pasa como parámetro en cada método. Métodos: `getAll(conferenciaId)`, `getById(id, conferenciaId)`, `create(conferenciaId, dto)`, `update(id, conferenciaId, dto)`, `delete(id, conferenciaId)`.

- [ ] **Tarea 12: `ExpositoresComponent` (lista + formulario)**
  - Archivos: `admin/src/app/expositores/expositores.component.ts`
  - Notas:
    - `standalone: true`, `ChangeDetectionStrategy.OnPush`.
    - Lee `conferenciaId` desde `ActivatedRoute.snapshot.params['id']`.
    - Signals: `expositores = signal<ExpositorListItemDto[]>([])`, `loading = signal(true)`, `mode = signal<'lista' | 'crear' | 'editar'>('lista')`, `editando = signal<ExpositorDetalleDto | null>(null)`.
    - En `ngOnInit` carga la lista.
    - Formulario reactivo inline (no componente separado): `FormBuilder` con campos `nombre` (required, maxLength 255), `bio`, `fotoUrl`, `email` ([email validator Angular]), `twitter`, `linkedin`, `web` (los tres últimos agrupan `redesSociales`).
    - Al guardar: construir `dto.redesSociales` desde los tres campos de redes solo si tienen valor.
    - Botón "Nuevo expositor" → `mode.set('crear')`, limpiar formulario.
    - Botón "Editar" en fila → `expositorService.getById(id, conferenciaId)` → cargar en formulario, `mode.set('editar')`, `editando.set(detalle)`.
    - Mostrar `tokenAcceso` del expositor en modo edición (read-only, como link copiable).
    - Botón "Eliminar" con confirmación simple (`window.confirm`).
    - `ChangeDetectionStrategy.OnPush` + signals: no usar subscriptions manuales sin `async pipe` o limpieza en `ngOnDestroy`.

- [ ] **Tarea 13: Actualizar `app.routes.ts`**
  - Archivos: `admin/src/app/app.routes.ts`
  - Notas: Agregar dentro de las rutas protegidas por `authGuard`:
    ```typescript
    {
      path: 'congreso/:id/expositores',
      canActivate: [authGuard],
      loadComponent: () => import('./expositores/expositores.component')
        .then(m => m.ExpositoresComponent)
    }
    ```

### Criterios de completitud técnica

El DEV puede considerar la historia técnicamente completa cuando:

- [ ] `dotnet build` sin warnings en `backend/`
- [ ] `dotnet ef migrations add AddExpositor` genera migración con: tabla `expositores`, columna `redes_sociales` tipo `jsonb`, índice único en `token_acceso`, FK `conferencia_id` con `ON DELETE CASCADE`, índice en `conferencia_id`
- [ ] `GET /api/dashboard/conferencias/{id}/expositores` retorna 404 si el congreso no pertenece al usuario autenticado
- [ ] `POST` crea el expositor con `token_acceso` generado por el servidor (no enviado por el cliente)
- [ ] El `token_acceso` NO aparece en la respuesta del listado (`GET /`)
- [ ] El `token_acceso` SÍ aparece en la respuesta del detalle (`GET /{id}`)
- [ ] Validación de formato de email retorna 400 cuando el formato es inválido
- [ ] `redes_sociales` se persiste como `jsonb` y se devuelve como objeto JSON (no como string)
- [ ] `ng build` sin errores en `admin/`
- [ ] El campo `email` en el formulario Angular está validado con el validator de email de Angular

---

## 5. Riesgos técnicos

| ID | Descripción | Probabilidad | Impacto | Mitigación propuesta |
|----|-------------|-------------|--------|---------------------|
| RT-4-01 | `JsonDocument` requiere disposición explícita (`IDisposable`). Si el modelo EF Core retiene una instancia de `JsonDocument` después del `DbContext` cycle, puede haber memory leaks en escenarios de alto volumen. | Baja | Baja | Usar `AsNoTracking()` en todas las queries de lectura (ya es la regla del proyecto). En escritura, llamar `doc.Dispose()` o usar `using` al construir el `JsonDocument` para el update si se crea uno temporal. LOG. |
| RT-4-02 | Colisión de `TokenAcceso` (Guid.NewGuid). La probabilidad es astronómicamente baja (~1 en 10^36) pero la lógica defensiva de verificación agrega una query extra en cada Create. | Muy baja | Baja | Mantener el chequeo defensivo con `AnyAsync` y retornar error 500 si colisiona. LOG. |
| RT-4-03 | La validación "no eliminar si tiene sesiones" (US-5) todavía no existe. Un expositor podría eliminarse aunque US-5 le asigne sesiones antes de que el DEV de US-5 implemente la validación. | Media | Media | Documentar en `implementation-notes.md` el TODO exacto en `DeleteAsync`. US-5 DEBE agregar la validación como parte de su alcance. WARN — registrar en risk-register. |
| RT-4-04 | El controller recibe `conferenciaId` como parámetro de ruta (`[Route("api/dashboard/conferencias/{conferenciaId:guid}/expositores")]`). Si el modelo de binding de ASP.NET Core no mapea automáticamente el parámetro de ruta al parámetro del método de acción, el `conferenciaId` llega como `Guid.Empty`. | Baja | Media | Confirmar que el nombre del parámetro en los métodos de acción coincide exactamente con `{conferenciaId}` en la plantilla de ruta. Es binding estándar de ASP.NET Core — funciona si los nombres coinciden. LOG. |

> RT-4-03 debe registrarse en `docs/risks/risk-register.md`.

---

## 6. Escalación arquitectónica

No aplica — la implementación es interna al módulo de expositores y sigue los patrones ya aprobados en el baseline C4 y los ADRs de US-2.

---

## 7. Contrato API

### `GET /api/dashboard/conferencias/{conferenciaId}/expositores`
- Auth: Bearer JWT requerido
- Response 200:
```json
[
  {
    "id": "uuid",
    "nombre": "Jane Smith",
    "bio": "Investigadora en IA",
    "fotoUrl": null,
    "email": "jane@example.com",
    "redesSociales": { "twitter": "@janesmith", "linkedin": "..." },
    "creadoEn": "2026-05-01T10:00:00Z"
  }
]
```
- Response 404: congreso no existe o no pertenece al usuario autenticado

### `POST /api/dashboard/conferencias/{conferenciaId}/expositores`
- Auth: Bearer JWT requerido
- Body:
```json
{
  "nombre": "Jane Smith",
  "bio": "Investigadora en IA",
  "fotoUrl": null,
  "email": "jane@example.com",
  "redesSociales": { "twitter": "@janesmith" }
}
```
- Response 201: `ExpositorDetalleDto` (incluye `tokenAcceso`)
- Response 400: `nombre` ausente o email con formato inválido
- Response 404: congreso no existe o no pertenece al usuario

### `GET /api/dashboard/conferencias/{conferenciaId}/expositores/{id}`
- Auth: Bearer JWT requerido
- Response 200: `ExpositorDetalleDto` (incluye `tokenAcceso`)
- Response 404: expositor no existe, no pertenece al congreso, o congreso no pertenece al usuario

### `PUT /api/dashboard/conferencias/{conferenciaId}/expositores/{id}`
- Auth: Bearer JWT requerido
- Body: `UpdateExpositorDto` (campos opcionales)
- Response 200: `ExpositorDetalleDto` actualizado
- Response 400: email con formato inválido
- Response 404: ownership fallido

### `DELETE /api/dashboard/conferencias/{conferenciaId}/expositores/{id}`
- Auth: Bearer JWT requerido
- Response 204: eliminado correctamente
- Response 404: ownership fallido
- Response 422: `{ "error": "TIENE_SESIONES_ASIGNADAS", "message": "No se puede eliminar un expositor con sesiones asignadas." }` (implementado en US-5)

---

## 8. Cambios en base de datos

### Nueva tabla: `expositores`

| Columna | Tipo PG | Restricciones |
|---------|---------|--------------|
| `id` | `uuid` | PK, default `gen_random_uuid()` |
| `conferencia_id` | `uuid` | FK → `conferencias(id)` ON DELETE CASCADE, NOT NULL |
| `nombre` | `varchar(255)` | NOT NULL |
| `bio` | `text` | nullable |
| `foto_url` | `text` | nullable |
| `email` | `varchar(254)` | nullable |
| `redes_sociales` | `jsonb` | nullable |
| `token_acceso` | `varchar(36)` | NOT NULL |
| `created_at` | `timestamptz` | NOT NULL, default `NOW()` |

### Índices

| Nombre | Columnas | Tipo |
|--------|----------|------|
| `IX_expositores_TokenAcceso` | `token_acceso` | UNIQUE |
| `IX_expositores_ConferenciaId` | `conferencia_id` | Simple |

---

## 9. Dependencias técnicas

- **US-2 completada y migrada**: la tabla `conferencias` debe existir en la base de datos antes de aplicar `AddExpositor`. La migración de US-4 declara FK hacia `conferencias`.
- **US-5 (Gestionar sesiones)**: debe declarar FK hacia `expositores` con `OnDelete(DeleteBehavior.Restrict)` o `SetNull`, y agregar la validación `TieneSessionesAsignadas` en `ExpositorService.DeleteAsync`.

---

## Aprobación

- [x] Preguntas funcionales resueltas — sin preguntas abiertas
- [x] Escalación arquitectónica — no aplica
- [x] Plan aprobado por TL

**Aprobado por:** Technical Lead
**Fecha de aprobación:** 2026-05-01
