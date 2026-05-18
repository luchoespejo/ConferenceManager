# Technical Plan — US-11: Mini-sitio con secciones configurables + tab Inscripciones

**Fecha:** 2026-05-18
**Autor:** Technical Lead
**Historia:** US-11
**Estado:** Aprobado

---

## 1. Resumen del análisis

US-11 amplía el modelo de dominio de `Conferencia` con 7 campos de texto y 5 flags booleanos, e incorpora tres entidades nuevas (`Organizador`, `FechaImportante`, `EjeTematico`) con relaciones FK hacia `Conferencia`. En el backend esto implica una migración EF Core, la extensión del DTO público y del servicio público, y tres controllers CRUD nuevos. El site Next.js recibe los campos nuevos en el mismo endpoint que ya consume y los renderiza en secciones condicionales; la página de inscripciones es una ruta nueva dentro del mismo `[slug]` segment. El admin Angular amplía `CongresoFormComponent` y agrega tres subsecciones CRUD nuevas, cada una como componente standalone.

El impacto es amplio (los tres subsistemas) pero estrictamente aditivo: no se modifica ninguna firma pública existente, no se rompen contratos de API vigentes, y la migración es solo `ADD COLUMN` y tablas nuevas (no hay columnas eliminadas ni renombradas). El riesgo principal es el volumen de superficie a implementar en un único ticket; se mitiga con un orden de implementación que permite prueba visual incremental desde el primer paso.

---

## 2. Análisis de impacto

### Archivos a crear o modificar

| Archivo / Módulo | Tipo de cambio | Razón |
|-----------------|----------------|-------|
| `backend/Models/Conferencia.cs` | Modificación | Agregar 7 campos texto + 5 flags bool |
| `backend/Models/Organizador.cs` | Creación | Nueva entidad |
| `backend/Models/FechaImportante.cs` | Creación | Nueva entidad |
| `backend/Models/EjeTematico.cs` | Creación | Nueva entidad |
| `backend/Data/AppDbContext.cs` | Modificación | Agregar 3 DbSet nuevos |
| `backend/DTOs/Public/ConferenciaPublicaDto.cs` | Modificación | Exponer campos nuevos + listas de las 3 entidades |
| `backend/DTOs/Public/OrganizadorPublicoDto.cs` | Creación | DTO para la lista de organizadores en el endpoint público |
| `backend/DTOs/Public/FechaImportantePublicaDto.cs` | Creación | DTO para fechas importantes |
| `backend/DTOs/Public/EjeTematicoPublicoDto.cs` | Creación | DTO para ejes temáticos |
| `backend/DTOs/Organizadores/CreateOrganizadorDto.cs` | Creación | Payload de creación admin |
| `backend/DTOs/Organizadores/UpdateOrganizadorDto.cs` | Creación | Payload de actualización admin |
| `backend/DTOs/Organizadores/OrganizadorDto.cs` | Creación | DTO de respuesta admin |
| `backend/DTOs/FechasImportantes/CreateFechaImportanteDto.cs` | Creación | Payload de creación admin |
| `backend/DTOs/FechasImportantes/UpdateFechaImportanteDto.cs` | Creación | Payload de actualización admin |
| `backend/DTOs/FechasImportantes/FechaImportanteDto.cs` | Creación | DTO de respuesta admin |
| `backend/DTOs/EjesTematicos/CreateEjeTematicoDto.cs` | Creación | Payload de creación admin |
| `backend/DTOs/EjesTematicos/UpdateEjeTematicoDto.cs` | Creación | Payload de actualización admin |
| `backend/DTOs/EjesTematicos/EjeTematicoDto.cs` | Creación | DTO de respuesta admin |
| `backend/DTOs/Conferencias/UpdateConferenciaDto.cs` | Modificación | Agregar 7 campos texto + 5 flags |
| `backend/DTOs/Conferencias/CreateConferenciaDto.cs` | Modificación | Agregar los mismos campos opcionales |
| `backend/DTOs/Conferencias/ConferenciaDetalleDto.cs` | Modificación | Exponer campos nuevos al panel admin |
| `backend/Services/IPublicService.cs` | Modificación | Sin firma nueva; el mapping en `GetConferenciaBySlugAsync` cambia para incluir Include de las 3 entidades |
| `backend/Services/PublicService.cs` | Modificación | Eager-load Organizadores/FechasImportantes/EjesTematicos con AsNoTracking |
| `backend/Services/ConferenciaService.cs` | Modificación | `MapToDetalleDto` + `UpdateAsync`/`CreateAsync` para los nuevos campos |
| `backend/Controllers/OrganizadoresController.cs` | Creación | CRUD bajo `/api/conferencias/{id}/organizadores` (Authorize) |
| `backend/Controllers/FechasImportantesController.cs` | Creación | CRUD bajo `/api/conferencias/{id}/fechas-importantes` (Authorize) |
| `backend/Controllers/EjesTematicosController.cs` | Creación | CRUD bajo `/api/conferencias/{id}/ejes-tematicos` (Authorize) |
| `backend/Migrations/` | Creación | Migración EF Core generada con `dotnet ef migrations add` |
| `site/app/[slug]/page.tsx` | Modificación | Secciones condicionales según toggles |
| `site/app/[slug]/inscripciones/page.tsx` | Creación | Página nueva con ISR revalidate=300 |
| `site/app/[slug]/layout.tsx` | Modificación | Tab "Inscripciones" condicional |
| `admin/src/app/congresos/congreso.model.ts` | Modificación | Extender `CongresoDetalleDto`, `UpdateCongresoDto`, `CreateCongresoDto` con campos nuevos; agregar interfaces `OrganizadorDto`, `FechaImportanteDto`, `EjeTematicoDto` y sus payloads |
| `admin/src/app/congresos/congreso.service.ts` | Modificación | Métodos CRUD para las 3 sub-entidades |
| `admin/src/app/congresos/congreso-form/congreso-form.component.ts` | Modificación | Nuevas secciones del formulario: 7 campos + 5 toggles + 3 sub-CRUDs |
| `admin/src/app/congresos/organizadores/organizadores.component.ts` | Creación | Componente standalone CRUD inline de organizadores (con upload logo) |
| `admin/src/app/congresos/fechas-importantes/fechas-importantes.component.ts` | Creación | Componente standalone CRUD inline de fechas importantes |
| `admin/src/app/congresos/ejes-tematicos/ejes-tematicos.component.ts` | Creación | Componente standalone CRUD inline de ejes temáticos |

### Impacto en otros módulos (regresión potencial)

| Módulo | Riesgo de regresión | Mitigación |
|--------|--------------------|-----------| 
| `tests/ConferenciaServiceTests.cs` | Bajo — el constructor `new ConferenciaService(_context)` sigue siendo válido; los tests existentes no testean los campos nuevos | QAA verifica que los tests existentes siguen pasando sin cambios; agrega casos para los nuevos campos |
| `PublicService.GetConferenciaBySlugAsync` | Bajo — el método agrega `Include`/`ThenInclude`; queries existentes no se rompen | Testear manualmente que el endpoint `/api/public/{slug}` sigue respondiendo 200 con una conferencia publicada |
| `site/app/[slug]/layout.tsx` | Bajo — se agrega un link condicional; los links existentes no cambian | Verificar visualmente que Programa y Expositores siguen apareciendo en el nav |
| `admin/congreso-form` | Medio — el formulario crece considerablemente; riesgo de introducir errores de template en la lógica existente | El DEV mantiene todas las secciones existentes intactas y solo agrega secciones nuevas al final; revisar que Submit/Publicar siguen funcionando |

### Impacto arquitectónico
- [x] **No** — la implementación es interna a los módulos existentes. Los nuevos controllers siguen el mismo patrón Authorize + ServiceResult que el resto. No hay nuevo contenedor C4 ni nueva integración externa.

---

## 3. Preguntas funcionales detectadas

1. **Borrado en cascada de las 3 entidades nuevas:** cuando se elimina una `Conferencia`, ¿deben eliminarse en cascada sus `Organizador`, `FechaImportante` y `EjeTematico`? El patrón vigente (US-2/3/4/5, registrado en memoria de proyecto) es eliminar en cascada las entidades hijo. Se asume el mismo comportamiento salvo indicación contraria.

2. **Renderizado de markdown en el site:** `ArancelesTexto`, `InformacionPago` y `ContactoAdicional` son texto markdown libre. La story dice renderizarlos en el site pero no especifica si debe usarse un parser markdown (ej. `react-markdown`) o texto plano con `white-space: pre-wrap`. Decisión necesaria antes de implementar `site/app/[slug]/inscripciones/page.tsx`. **Recomendación del TL:** usar `react-markdown` o similar para respetar la intención de "tabla de precios" en markdown; de lo contrario se pierde el formateo. Confirmar con FA/PO.

3. **Autorización de los 3 controllers nuevos:** la story dice que los endpoints admin están bajo `/api/conferencias/{id}/organizadores`. Los controllers admin existentes usan `[Authorize]` y verifican `UsuarioId` contra la `Conferencia`. ¿Se aplica el mismo patrón (el organizador solo puede gestionar sus propias entidades)? Se asume que sí.

4. **Orden de `Organizador`:** el campo `Orden: int` implica que el admin puede reordenar organizadores. ¿Debe haber un endpoint de reordenamiento o simplemente se edita el campo `Orden` via PUT? La story no especifica; se implementa solo mediante el campo editable en el CRUD (no drag-and-drop).

> Estado: Pendiente resolución de punto 2 (markdown renderer). Los puntos 1, 3 y 4 se resuelven por convención del codebase.

---

## 4. Plan de trabajo

### Enfoque técnico

Se implementa en tres fases estrictamente ordenadas: **backend primero** (modelo → migración → DTOs → servicios → controllers), luego **site** (consume el DTO ya extendido), luego **admin** (consume los endpoints ya disponibles). Este orden permite validar visualmente el mini-sitio antes de completar el admin.

Los tres controllers nuevos siguen exactamente el mismo patrón que `SalasController` o `ExpositoresController`: inyectan `AppDbContext` directamente (no hay capa de servicio separada para entidades simples de este tipo), verifican ownership de la `Conferencia` por `UsuarioId`, y usan `AsNoTracking` en queries de lectura. Los DTOs de respuesta del panel admin son distintos de los DTOs públicos.

La migración EF Core agrega columnas nullable a `Conferencias` (sin `DEFAULT NOT NULL`) y crea tres tablas nuevas con FK a `Conferencias` con `ON DELETE CASCADE`.

### Tareas de implementación

> Las ramas siguen el patrón `feature/US-{N}-{short-title}` definido en `.claude/settings.json`. `pipeline.devPlanReview` es `false`, por lo que el DEV puede implementar directamente sin plan previo adicional.

- [ ] **Tarea 1: Modelos de dominio y migración**
  - Archivos: `backend/Models/Conferencia.cs`, `backend/Models/Organizador.cs`, `backend/Models/FechaImportante.cs`, `backend/Models/EjeTematico.cs`, `backend/Data/AppDbContext.cs`
  - Agregar en `Conferencia.cs` los 7 campos string? y los 5 bool con sus valores default.
  - Crear los 3 modelos nuevos con `Guid Id`, `Guid ConferenciaId`, campos propios, y nav property `Conferencia`.
  - Registrar los 3 `DbSet` en `AppDbContext`.
  - Configurar cascade delete en `OnModelCreating` (o via Fluent API): `.HasMany(c => c.Organizadores).WithOne(o => o.Conferencia).HasForeignKey(o => o.ConferenciaId).OnDelete(DeleteBehavior.Cascade)` (repetir para las otras dos entidades).
  - Generar la migración: `dotnet ef migrations add US11_ConferenciaFields_NuevasEntidades --project backend`
  - Revisar el SQL generado antes de aplicar: debe ser solo ADD COLUMN (nullable) + CREATE TABLE.
  - Aplicar: `dotnet ef database update --project backend`

- [ ] **Tarea 2: DTOs backend**
  - Archivos: todos los DTOs listados en la sección 2.
  - Extender `UpdateConferenciaDto` y `CreateConferenciaDto` con los campos nuevos.
  - Extender `ConferenciaDetalleDto` con los campos nuevos (sin las listas de sub-entidades — esas van en el DTO público).
  - Crear los DTOs de respuesta y payload para Organizador, FechaImportante, EjeTematico (tres pares create/update/response cada uno, en sus carpetas `DTOs/Organizadores/`, `DTOs/FechasImportantes/`, `DTOs/EjesTematicos/`).
  - Extender `ConferenciaPublicaDto` con los 7 campos texto + 5 flags + listas `Organizadores`, `FechasImportantes`, `EjesTematicos` usando los DTOs públicos nuevos.

- [ ] **Tarea 3: Servicios backend**
  - Archivos: `backend/Services/ConferenciaService.cs`, `backend/Services/PublicService.cs`
  - En `ConferenciaService`: extender `MapToDetalleDto` con los campos nuevos; extender `CreateAsync` y `UpdateAsync` para asignarlos.
  - En `PublicService.GetConferenciaBySlugAsync`: agregar `.Include(c => c.Organizadores).Include(c => c.FechasImportantes).Include(c => c.EjesTematicos)` antes de `FirstOrDefaultAsync`; mapear las listas al DTO público. Mantener `AsNoTracking`.

- [ ] **Tarea 4: Controllers admin para sub-entidades**
  - Archivos: `backend/Controllers/OrganizadoresController.cs`, `backend/Controllers/FechasImportantesController.cs`, `backend/Controllers/EjesTematicosController.cs`
  - Ruta base: `[Route("api/dashboard/conferencias/{conferenciaId:guid}/organizadores")]` (idem para las otras dos).
  - Decorator `[Authorize]`.
  - Cada controller implementa: `GET` (lista), `POST` (crear), `PUT {id}` (actualizar), `DELETE {id}` (eliminar).
  - Todos los endpoints verifican que `conferenciaId` pertenece al `UsuarioId` del JWT antes de operar.
  - Queries de lectura con `AsNoTracking`.

- [ ] **Tarea 5: Site — layout y secciones condicionales**
  - Archivos: `site/app/[slug]/layout.tsx`, `site/app/[slug]/page.tsx`
  - En `layout.tsx`: la interfaz `ConferenciaBasica` ya hace fetch del endpoint público. Agregar `mostrarInscripciones: boolean` a la interfaz local; renderizar `<Link href={...inscripciones}>Inscripciones</Link>` condicionalmente.
  - En `page.tsx`: ampliar la interfaz `Conferencia` con todos los campos nuevos. Agregar secciones condicionales en este orden: Fechas importantes (si `mostrarFechas`), Descripción + Ejes temáticos (si `mostrarDescripcion`), Organizado por (si `mostrarOrganizadores` — grid 120x60 `object-contain`), Contacto (si `mostrarContacto` — muestra `emailContacto`, `instagram`, `contactoAdicional`).
  - Mantener `export const revalidate = 300`.

- [ ] **Tarea 6: Site — página de inscripciones**
  - Archivo: `site/app/[slug]/inscripciones/page.tsx` (creación)
  - ISR: `export const revalidate = 300`.
  - Fetch del mismo endpoint `/api/public/{slug}` (sin endpoint nuevo — los datos ya vienen en `ConferenciaPublicaDto`).
  - Renderizar: `arancelesTexto` (markdown), `informacionPago` (markdown), botón CTA `formularioInscripcionUrl` (target blank).
  - Si `mostrarInscripciones` es false y el usuario accede directamente a la URL, redirigir a `/${slug}` con `redirect()`.
  - **Pendiente confirmación:** usar `react-markdown` para renderizar los campos markdown (ver pregunta funcional 2). Si se decide texto plano, usar `<pre style="white-space: pre-wrap">`.

- [ ] **Tarea 7: Admin — modelo y servicio**
  - Archivos: `admin/src/app/congresos/congreso.model.ts`, `admin/src/app/congresos/congreso.service.ts`
  - Extender `CongresoDetalleDto`, `CreateCongresoDto`, `UpdateCongresoDto` con los campos nuevos.
  - Agregar interfaces `OrganizadorDto`, `CreateOrganizadorDto`, `UpdateOrganizadorDto`, `FechaImportanteDto`, `CreateFechaImportanteDto`, `UpdateFechaImportanteDto`, `EjeTematicoDto`, `CreateEjeTematicoDto`, `UpdateEjeTematicoDto`.
  - En `congreso.service.ts`: agregar métodos `getOrganizadores`, `createOrganizador`, `updateOrganizador`, `deleteOrganizador` (idem para las otras dos entidades).

- [ ] **Tarea 8: Admin — componentes CRUD de sub-entidades**
  - Archivos: `admin/src/app/congresos/organizadores/organizadores.component.ts`, `fechas-importantes/fechas-importantes.component.ts`, `ejes-tematicos/ejes-tematicos.component.ts`
  - Cada uno: standalone, ChangeDetectionStrategy.OnPush, `@Input({ required: true }) conferenciaId: string`.
  - Patrones: lista con botón Agregar, formulario inline (no modal separado), botones Editar/Eliminar por ítem.
  - `OrganizadoresComponent`: incluye `<app-image-upload>` para `logoUrl`.
  - Reutilizar `ConfirmModalService` para confirmaciones de eliminación.

- [ ] **Tarea 9: Admin — formulario principal**
  - Archivo: `admin/src/app/congresos/congreso-form/congreso-form.component.ts`
  - Agregar card "Contenido del sitio" con inputs para los 7 campos texto (textareas para los campos markdown) y 5 checkboxes/toggles para los flags.
  - Agregar card "Organizadores" con `<app-organizadores [conferenciaId]="id">` (solo visible en modo edición, no en creación).
  - Agregar card "Fechas importantes" con `<app-fechas-importantes [conferenciaId]="id">`.
  - Agregar card "Ejes temáticos" con `<app-ejes-tematicos [conferenciaId]="id">`.
  - Extender `patchValue` en `loadCongresoData` con los campos nuevos.
  - Extender los objetos `dto` en `create()` y `update()` con los campos nuevos.

### Criterios de completitud técnica

- [ ] `dotnet build` sin errores ni warnings en `backend/`
- [ ] La migración aplica sin errores en la base de datos local
- [ ] `GET /api/public/{slug}` devuelve los campos nuevos (verificar con curl o browser en conf publicada)
- [ ] `GET /api/dashboard/conferencias/{id}/organizadores` devuelve 200 con lista vacía para una conferencia propia
- [ ] `POST /api/dashboard/conferencias/{id}/organizadores` crea un organizador
- [ ] El mini-sitio en `http://localhost:3000/{slug}` muestra las secciones condicionales cuando los flags están activados
- [ ] `http://localhost:3000/{slug}/inscripciones` renderiza aranceles e info de pago
- [ ] La tab "Inscripciones" aparece en el nav solo cuando `mostrarInscripciones = true`
- [ ] El formulario admin guarda los 7 campos nuevos y los 5 toggles sin perder los campos existentes
- [ ] Los 3 sub-CRUDs admin (Organizadores, Fechas, Ejes) funcionan sin errores de consola
- [ ] `AsNoTracking` en todas las queries de lectura nuevas
- [ ] Sin NgModules — todos los componentes nuevos son standalone

---

## 5. Riesgos técnicos

| ID | Descripción | Probabilidad | Impacto | Mitigación propuesta |
|----|-------------|-------------|---------|----------------------|
| RT-11-01 | `PublicService.GetConferenciaBySlugAsync` agrega 3 `Include` sobre una entidad que antes no tenía navegación a colecciones. Si la migración no configuró correctamente las FKs o las nav properties, EF Core lanzará excepción en tiempo de ejecución en lugar de retornar null | Baja | Alto | Revisar el SQL de la migración antes de aplicar; probar el endpoint GET público inmediatamente después de la migración |
| RT-11-02 | `congreso-form.component.ts` es el componente Angular más grande del proyecto (473 líneas). Agregar las secciones de Tarea 9 podría superar las 700+ líneas, dificultando el mantenimiento y el template type-checking | Media | Baja | Considerar extraer la sección "Contenido del sitio" a un sub-componente standalone `ContenidoSitioFormComponent` si el DEV lo considera pertinente; no es obligatorio para esta US |
| RT-11-03 | La página `/inscripciones` tiene `export const revalidate = 300` pero el backend no llama `/api/revalidate` para esta ruta todavía (la revalidación en `ConferenciasController` no conoce la ruta `/inscripciones`). El contenido quedará stale hasta el TTL | Media | Baja | En local esto no aplica (no hay ISR real). Para producción, agregar la ruta `/[slug]/inscripciones` a las llamadas de revalidación cuando el organizador guarda cambios — esto puede hacerse en la misma US o en una tarea de seguimiento |
| RT-11-04 | Si el parser markdown elegido (`react-markdown`) no está en el `package.json` del site, el DEV deberá instalarlo. Instalar paquetes en el site podría requerir verificar compatibilidad con Next.js 14 App Router | Baja | Baja | Verificar `site/package.json` antes de decidir el parser; como alternativa segura usar `<pre>` con `white-space: pre-wrap` para evitar la dependencia |

Ningún riesgo alcanza la categoría High×High. RT-11-01 es Alto en impacto pero Bajo en probabilidad; se mitiga con verificación inmediata post-migración. No se requiere escalada a ARCH.

---

## 6. Escalada arquitectónica

No aplica. El impacto es interno a los módulos existentes. El ADR-004 cubre explícitamente la estrategia ISR para la landing page y rutas derivadas. No hay decisión arquitectónica nueva requerida.

---

## 7. Dependencias técnicas

- La base de datos PostgreSQL local debe estar accesible para aplicar la migración.
- El toolchain `dotnet ef` debe estar instalado globalmente (`dotnet tool install --global dotnet-ef`) o como herramienta local del proyecto.
- Si se decide usar `react-markdown`, debe instalarse en `site/` antes de la Tarea 6.
- No hay dependencias con otras historias en curso.

### Detalle de la migración EF Core

La migración generada en la Tarea 1 debe producir el siguiente SQL lógico (el DEV debe revisarlo antes de aplicar):

```sql
-- Columnas nuevas en tabla Conferencias (todas nullable, sin DEFAULT NOT NULL)
ALTER TABLE "Conferencias" ADD "Lema" text;
ALTER TABLE "Conferencias" ADD "EmailContacto" text;
ALTER TABLE "Conferencias" ADD "Instagram" text;
ALTER TABLE "Conferencias" ADD "FormularioInscripcionUrl" text;
ALTER TABLE "Conferencias" ADD "ArancelesTexto" text;
ALTER TABLE "Conferencias" ADD "InformacionPago" text;
ALTER TABLE "Conferencias" ADD "ContactoAdicional" text;
ALTER TABLE "Conferencias" ADD "MostrarFechas" boolean NOT NULL DEFAULT TRUE;
ALTER TABLE "Conferencias" ADD "MostrarDescripcion" boolean NOT NULL DEFAULT TRUE;
ALTER TABLE "Conferencias" ADD "MostrarOrganizadores" boolean NOT NULL DEFAULT FALSE;
ALTER TABLE "Conferencias" ADD "MostrarContacto" boolean NOT NULL DEFAULT TRUE;
ALTER TABLE "Conferencias" ADD "MostrarInscripciones" boolean NOT NULL DEFAULT FALSE;

-- Tabla Organizadores
CREATE TABLE "Organizadores" (
    "Id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "ConferenciaId" uuid NOT NULL,
    "Nombre" text NOT NULL,
    "LogoUrl" text,
    "Orden" integer NOT NULL,
    CONSTRAINT "PK_Organizadores" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_Organizadores_Conferencias_ConferenciaId"
        FOREIGN KEY ("ConferenciaId") REFERENCES "Conferencias" ("Id") ON DELETE CASCADE
);

-- Tabla FechasImportantes
CREATE TABLE "FechasImportantes" (
    "Id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "ConferenciaId" uuid NOT NULL,
    "Descripcion" text NOT NULL,
    "Fecha" date NOT NULL,
    "FechaFin" date,
    CONSTRAINT "PK_FechasImportantes" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_FechasImportantes_Conferencias_ConferenciaId"
        FOREIGN KEY ("ConferenciaId") REFERENCES "Conferencias" ("Id") ON DELETE CASCADE
);

-- Tabla EjesTematicos
CREATE TABLE "EjesTematicos" (
    "Id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "ConferenciaId" uuid NOT NULL,
    "Nombre" text NOT NULL,
    CONSTRAINT "PK_EjesTematicos" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_EjesTematicos_Conferencias_ConferenciaId"
        FOREIGN KEY ("ConferenciaId") REFERENCES "Conferencias" ("Id") ON DELETE CASCADE
);
```

Los bools con default deben especificarse en la Fluent API o con `[DefaultValue]` para que EF Core genere el `DEFAULT` correcto en PostgreSQL:

```csharp
// En OnModelCreating o en una EntityTypeConfiguration
modelBuilder.Entity<Conferencia>()
    .Property(c => c.MostrarFechas).HasDefaultValue(true);
modelBuilder.Entity<Conferencia>()
    .Property(c => c.MostrarDescripcion).HasDefaultValue(true);
modelBuilder.Entity<Conferencia>()
    .Property(c => c.MostrarContacto).HasDefaultValue(true);
// MostrarOrganizadores y MostrarInscripciones defaultean a false (valor por defecto de bool en C#)
```

### Cómo probar en local

**Requisitos previos:** backend corriendo en `localhost:5000`, Next.js en `localhost:3000`, admin en `localhost:4200`, PostgreSQL local accesible.

1. Aplicar la migración: `dotnet ef database update --project backend`
2. Iniciar el backend: `dotnet run --project backend`
3. Verificar que `GET http://localhost:5000/api/public/{slug}` devuelve los nuevos campos (inicialmente null/false para una conferencia existente).
4. Desde el panel admin, ir a Configuración de un congreso y verificar que se guardan los 7 campos nuevos y los 5 toggles.
5. Activar `MostrarFechas = true`, agregar una fecha importante via el sub-CRUD.
6. Iniciar Next.js: `cd site && npm run dev`
7. Navegar a `http://localhost:3000/{slug}` y verificar que la sección "Fechas importantes" aparece.
8. Activar `MostrarInscripciones = true`, guardar, y verificar que la tab "Inscripciones" aparece en el nav del mini-sitio.
9. Navegar a `http://localhost:3000/{slug}/inscripciones` y verificar que se renderizan aranceles e info de pago.
10. Desactivar `MostrarInscripciones = true`, verificar que la tab desaparece y que `/inscripciones` redirige al home.
11. Agregar organizadores con logo y verificar el grid 120x60 en la sección "Organizado por".

---

## Aprobacion

- [x] Preguntas funcionales: punto 2 (markdown renderer) pendiente de confirmacion con FA/PO; los demas puntos resueltos por convencion del codebase
- [x] Escalada arquitectonica: no aplica
- [x] Plan aprobado por TL

**Aprobado por:** Technical Lead
**Fecha de aprobacion:** 2026-05-18
