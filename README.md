# ConferenceManager

SaaS multi-tenant para gestión y transmisión de congresos. Permite a organizadores crear, configurar y publicar congresos con branding personalizado. Los asistentes acceden a un mini-sitio público dinámico por subdominio.

## Estructura del proyecto

```
ConferenceManager/
├── backend/          → .NET 8 Web API + PostgreSQL (EF Core)
├── admin/            → Angular 17+ (panel para organizadores)
├── site/             → Next.js 14 (mini-sitio público)
└── docs/             → Documentación de arquitectura y decisiones
```

## Stack tecnológico

| Capa | Tech | Notas |
|------|------|-------|
| **API** | .NET 8 Web API | CQRS pattern, Minimal APIs |
| **BD** | PostgreSQL 16 | EF Core 8, migrations versionadas |
| **Admin** | Angular 17+ | Standalone components, Signals, OnPush |
| **Sitio Público** | Next.js 14 App Router | SSR/ISR/CSR dinámico por slug |
| **Almacenamiento** | Local (dev) / Cloudflare R2 (prod) | Base64 en DB para dev |
| **Email** | Resend | Verificación, notificaciones |
| **QR / PDF** | QRCoder, PdfSharp | .NET libraries |

## Quick Start

### Requisitos previos

- **Node.js**: 20.15.0+ (verificar con `nvm use`)
- **.NET**: 8.0 SDK
- **Docker**: Docker Compose para BD PostgreSQL
- **Git**: Para control de versiones

### Levantar en desarrollo

1. **Clonar y entrar al directorio:**
   ```bash
   git clone https://github.com/luchoespejo/ConferenceManager.git
   cd ConferenceManager
   ```

2. **Iniciar contenedores (DB + API + Admin + Sitio):**
   ```bash
   docker-compose up -d --build
   ```
   
   Esto levanta:
   - Backend en `http://localhost:5000`
   - Admin panel en `http://localhost:4200`
   - Sitio público en `http://localhost:3000`
   - PostgreSQL en `localhost:5432`

3. **Seedear datos de demo:**
   ```bash
   curl -X POST http://localhost:5000/api/seed
   ```

4. **Credenciales de demo:**
   - Email: `demo@example.com`
   - Pass: `Demo@1234`

### Parar contenedores

```bash
docker-compose down
```

Para limpiar BD:
```bash
docker-compose down -v
```

## Estructura de carpetas backend

```
backend/
├── Controllers/           → Endpoints HTTP
├── Features/              → CQRS (Commands, Queries)
├── Models/                → Entidades de dominio
├── Data/
│   ├── AppDbContext.cs    → EF Core context
│   ├── Migrations/        → Migraciones DB versionadas
│   └── SeedData.cs        → Datos de demo
├── Services/              → Lógica de negocio
├── DTOs/                  → Data transfer objects
├── Dockerfile             → Imagen Docker
└── Program.cs             → Startup + DI
```

## Patrones y convenciones

### Backend (.NET)

- **CQRS**: Separar comandos (write) de queries (read)
- **AsNoTracking**: Siempre en queries de lectura (EF Core)
- **UUIDs**: Todas las primary keys son `Guid`
- **Migrations**: Versionadas, aplicadas en startup (dev only)
- **JWT**: 24h expiry, custom claims por rol (usuario/expositor)
- **Naming**: PascalCase en código, snake_case en BD (EF Core convention)

**Ejemplo CQRS:**
```csharp
// Command
public record CreateConferenciaCommand(string Nombre, string Slug, ...);
public interface ICreateConferenciaCommandHandler 
{
    Task<ServiceResult<ConferenciaDto>> ExecuteAsync(CreateConferenciaCommand cmd);
}

// Query
public record GetConferenciaQuery(Guid Id, Guid UsuarioId);
public interface IGetConferenciaQueryHandler
{
    Task<ConferenciaDto?> ExecuteAsync(GetConferenciaQuery query);
}
```

### Admin (Angular)

- **Standalone components**: Sin `NgModule`
- **Signals**: Reactive state management
- **OnPush**: Change detection strategy
- **RxJS**: Para HTTP y side effects
- **Typing**: Fuertemente tipado, evitar `any`

### Sitio Público (Next.js)

- **App Router**: Arquitectura basada en directorios
- **Dynamic routes**: `[slug]/page.tsx` para congresos
- **ISR**: Revalidación incremental tras cambios en BD
- **API Routes**: Minimal, proxy a backend

## Testing

Ver [`docs/TEST_STRATEGY.md`](docs/TEST_STRATEGY.md) para plan detallado de tests.

**Correr tests backend:**
```bash
cd backend
dotnet test --verbosity normal
```

**Correr tests admin (Angular):**
```bash
cd admin
npm test
```

**Correr tests sitio (Next.js):**
```bash
cd site
npm test
```

## CI/CD

- **Branch principal**: `main` (producción)
- **Branch integración**: `develop`
- **Naming**: `feature/US-{N}-{title}` o `fix/US-{N}-{title}`
- **Commits**: Conventional Commits (`feat:`, `fix:`, `refactor:`, `docs:`)
- **Push policy**: Manual (nunca automático)

Merge solo vía PR con code review.

## Documentación arquitectura

- **C4 diagrams**: `docs/architecture/c4-*.md`
- **ADRs**: `docs/architecture/adr/` (decisiones técnicas)
- **Onboarding**: `docs/onboarding/dev-guide.md`

## Problemas comunes

### "INVALID_CREDENTIALS" en login
- Verificar que `/api/seed` fue ejecutado
- Credenciales: `demo@example.com` / `Demo@1234`

### Upload falla (500)
- Verificar que tabla `imagenes_almacenadas` existe en BD
- Ver logs: `docker logs conference_backend`

### Node version mismatch
- Usar `nvm use` (archivo `.nvmrc` tiene la versión correcta)
- Reinstalar node_modules si falla: `rm -rf node_modules package-lock.json && npm install`

### Migrations no se aplican
- Backend automáticamente migra en startup (dev only)
- En prod: ejecutar `dotnet ef database update` manualmente
- Verificar `__EFMigrationsHistory` table en BD

## Contacto y contribución

Seguir `.claude/settings.json` y `CLAUDE.md` para workflow de desarrollo con agentes.

Para reportar bugs o sugerir features, usar GitHub Issues.
