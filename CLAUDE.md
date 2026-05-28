# ConferenceManager — Project Guide

## Project overview

SaaS multi-tenant para gestión de congresos. Cada cliente crea y gestiona su congreso con branding propio. El sistema genera un mini-sitio público accesible vía subdominio dinámico (`{slug}.tuplataforma.com`). Sin login tradicional: organizadores entran con JWT (panel admin), expositores con `token_acceso` (link mágico).

## Repos structure

```
ConferenceManager/
├── backend/        → .NET 10 Web API + PostgreSQL (EF Core 10)
├── site/           → Next.js 16 App Router. Contiene DOS apps:
│                       • mini-sitio público dinámico  → app/[slug]/...
│                       • panel admin del organizador  → app/admin/(protected)/...
├── backend.tests/  → tests del backend
├── tests/          → tests adicionales
└── docs/           → ADRs, C4, backlog, design specs
```

> **Nota:** el viejo `admin/` (Angular) fue **eliminado** (commit 2026-05-22). Si la carpeta sigue en disco es cruft local sin trackear — ignorala. El panel admin vive dentro de `site/`.

## Stack

| Layer | Technology |
|-------|-----------|
| API | **.NET 10** Web API (controllers + Features/ vertical slices) |
| DB | **PostgreSQL** + **EF Core 10** (Npgsql). No hay Dapper. |
| Admin panel | **Next.js 16** App Router dentro de `site/app/admin/(protected)` |
| Public site | **Next.js 16** App Router (`site/app/[slug]`) — ISR/SSR/CSR según ruta |
| Page builder | **Puck v0.21.2** (`@puckeditor/core`) — maquetador del home |
| Image storage | **PostgreSQL** (bytes en columna `Datos`), servidas en `/api/files/{id}`. **NO hay R2/S3.** |
| Email | **Resend** vía HTTP (`ResendEmailService`), fallback `FakeEmailService` |
| QR generation | QRCoder (.NET) |
| Certificado PDF | HTML + `window.print()` del browser (no PdfSharp) |
| Auth | JWT (`Microsoft.AspNetCore.Authentication.JwtBearer`) + BCrypt |
| Hosting API | Railway / Render |
| Hosting FE | Vercel (wildcard DNS `*.tuplataforma.com`) |
| Static mirror | GitHub repo `conference-sites` (export estático, ver abajo) |

## Backend architecture

Dos estilos coexisten:

- **`Controllers/` + `Services/`** — la mayoría de los recursos (Conferencias, Sesiones, Expositores, etc.). Servicios con interfaz `I{X}Service` + impl. Devuelven `ServiceResult<T>` con códigos de error tipados (`{X}ErrorCodes.cs`).
- **`Features/`** — vertical slices estilo CQRS (handlers Command/Query) para `Auth`, `Dashboard`, `Files`. Ej: `UploadImageCommand` → `IUploadImageCommandHandler`.

Servicios clave a conocer:

| Servicio | Rol |
|----------|-----|
| `StaticSiteService` | Genera el ZIP estático del mini-sitio (HTML + `assets/style.css` + imágenes). |
| `PuckHtmlRenderer` | Renderiza el layout JSON de Puck a HTML estático (C#). Espejo del render React. |
| `GithubPublishService` | Publica: genera ZIP → extrae archivos → push al repo `conference-sites` en GitHub. |
| `TipTapHtmlConverter` | Convierte el richtext de TipTap (Puck) a HTML. |
| `QrService` | Genera QR de sesiones. |
| `ResendEmailService` | Envío de mails (links mágicos, etc.). |

## Instancias Vercel y flujo de despliegue

Hay **dos instancias Vercel independientes**:

| Instancia | URL | Qué sirve |
|-----------|-----|-----------|
| `conference-manager-irl1` | `*.vercel.app` (admin) | Next.js completo: panel admin (`/admin/...`) + rutas dinámicas `/[slug]/` que hablan con el backend |
| `conference-manager-ten` | `conference-manager-ten.vercel.app` | **Solo HTML estático** del repo `conference-sites` — sin backend, sin Next.js runtime |

### Flujo "Desplegar sitio" (el que importa para el público)

```
Admin (irl1) → click "Desplegar"
  → Backend API → StaticSiteService
    → PuckHtmlRenderer.RenderMainContent()   ← genera HTML de la maqueta Puck
    → GithubPublishService                   ← push a github.com/luchoespejo/conference-sites/
      → Vercel auto-deploy detecta el push
        → conference-manager-ten.vercel.app/{slug}  ← URL pública final
```

**Este es el camino real del público.** `PuckHtmlRenderer` (C#) es el renderer que importa para este flujo.

### Flujo dinámico (secundario, irl1)

`conference-manager-irl1/{slug}` → Next.js → fetch `/api/public/{slug}` → renderiza con `PuckRenderer.tsx`. Solo accesible vía la URL del admin Vercel, no es la URL pública de los congresos.

## Mini-sitio: dos rutas de publicación

El home del congreso se arma con el **maquetador Puck**. El layout se guarda como JSON en `Conferencia.LayoutJson` (y/o `ConferenciaLayout`). Ese mismo layout se renderiza por **dos caminos independientes**:

1. **Export estático — camino principal** (`conference-manager-ten.vercel.app/{slug}`) — `StaticSiteService` + `PuckHtmlRenderer` (C#) generan HTML plano, push a `conference-sites`, Vercel sirve estático. CSS generado en `StaticSiteService.GenerateCss()`.
2. **Sitio dinámico — camino secundario** (`conference-manager-irl1/{slug}`) — Next.js `site/app/[slug]/...` + `PuckRenderer.tsx` renderiza en runtime con React/Puck, habla con el backend.

> **Regla clave:** cualquier cambio visual del mini-sitio que deba verse en ambos lados hay que aplicarlo **en los dos**: backend (`StaticSiteService` / `PuckHtmlRenderer`) **y** Next.js (`globals.css` / `PuckRenderer.tsx`). Tocar solo uno deja el otro desactualizado.

### Imágenes en el sitio

- Se suben vía `POST /api/dashboard/upload` (proxy Next: `site/app/api/admin/upload`), se guardan **en la DB** como bytes y se sirven en `/api/files/{id}`. **No hay R2.**
- El export estático debe **descargar** cada `/api/files/{id}` y empaquetarla como `assets/img-*.{ext}` dentro del ZIP (si no, el HTML estático apunta a un backend que no existe en deploy estático).

### Dark mode / paleta de colores

Browsers móviles (Samsung Internet, Chrome Android Force-Dark) pueden pisar la paleta. Defensa en 3 capas, presente en **ambos lados**:

1. `color-scheme: light` en `:root`.
2. `<meta name="color-scheme" content="light">` en cada `<head>` (en Next vía `export const viewport = { colorScheme: 'light' }`).
3. `@media (prefers-color-scheme: dark)` que resetea las variables CSS a sus valores light.

## Build / run / test

```bash
# Backend
cd backend && dotnet build --no-restore -c Release
cd backend && dotnet run

# Site (Next.js 16)
cd site && npm run dev
cd site && npm run build

# Tests backend
dotnet test ConferenceManager.Tests.slnf
```

> `site/` corre Next.js 16 con breaking changes vs. tu conocimiento previo — leer `site/node_modules/next/dist/docs/` antes de escribir código Next (ver `site/AGENTS.md`).

## Workflow & pipeline (`.claude/settings.json`)

- `pipeline.mode`: **`lean`** (sin checkpoints obligatorios por fase)
- `pipeline.devPlanReview`: **`false`**
- `git.pushPolicy`: **`manual`** — nunca push automático, siempre confirmar
- `git.baseBranch`: `main` · `git.integrationBranch`: `develop`
- Skills disponibles: `/prime` (boot de contexto), `/orchestrate` (pipeline lean de historia)

## Branch naming

```
feature/US-{N}-{short-title}
fix/US-{N}-{short-title}
release/{version}
```

## Commit format (Conventional Commits, en inglés)

```
feat(US-N): concise imperative description
fix(US-N): bug fix description
refactor(US-N): description
docs(US-N): description
```

## Critical rules

1. **Nunca push** sin confirmación del usuario (`pushPolicy: manual`).
2. **Nunca operación destructiva de git** (`reset --hard`, `push --force`) sin confirmación explícita.
3. **AsNoTracking** siempre en queries de lectura EF Core.
4. **UUID** como PK en todas las tablas (nunca int).
5. **Multitenancy by slug** — toda query pública filtra por `conferencia.slug`.
6. **Cambios visuales del mini-sitio van en los dos renderers** (estático C# + Next live).
7. **Imágenes viven en la DB** (`/api/files/{id}`), no en R2; el export estático las empaqueta.
8. **ISR revalidation** — el backend llama `/api/revalidate` de Next tras cambios relevantes.
9. **encuesta_url** es campo libre en sesiones (URL externa, no hay forms propios).

## Key domain concepts

- **Congreso (`Conferencia`)**: entidad central. `slug` = subdominio. Home maquetado con Puck (`LayoutJson`).
- **Expositor**: accede vía `token_acceso` (link mágico). Sube material, ve su logística.
- **Participante**: registrado por el organizador. Flag `puede_generar_certificado` habilita la descarga.
- **Sesion**: sala, expositor, horario, track, `encuesta_url` (link externo opcional), `qr_code_url`.
- **Certificado**: el participante ingresa email (verificado contra la DB) + nombre → página HTML imprimible (`window.print()`).
- **AvisoUrgente**: banner en el mini-sitio, polling 30s. Canal de notificación principal durante el evento.

## Artifact locations

```
docs/
├── backlog/product-backlog.md
├── architecture/
│   ├── c4-context.md · c4-container.md · c4-component.md
│   └── adr/ADR-{NNN}-{title}.md
├── design/design-baseline.md · design-responsive.md
├── risks/risk-register.md
├── EMAIL_CONFIGURATION.md
└── RENDER_DEPLOYMENT.md
```

## Language policy

- Código (variables, funciones, clases): **English**
- Documentación (ADRs, design, docs): **Español**
- Commits: **English** (Conventional Commits)
- UI visible al usuario final: **Español**
