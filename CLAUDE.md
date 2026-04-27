# ConferenceManager — Project Guide

## Project overview

SaaS multi-tenant para gestión de congresos. Cada cliente crea y gestiona su congreso con branding propio. El sistema genera un mini-sitio público accesible via subdominio dinámico (`{slug}.tuplataforma.com`). Sin login tradicional para organizadores (admin_token) ni expositores (token_acceso).

## Repos structure

```
ConferenceManager/
├── backend/    → .NET Core 8 Web API + PostgreSQL (EF Core)
├── admin/      → Angular 17+ (panel organizador)
└── site/       → Next.js 14 App Router (mini-sitio público, único deploy)
```

## Stack

| Layer | Technology |
|-------|-----------|
| API | .NET Core 8 Web API |
| DB | PostgreSQL (EF Core 8 + Dapper para queries complejas) |
| Admin | Angular 17+ standalone components, signals, OnPush |
| Public site | Next.js 14 App Router (ISR/SSR/CSR según ruta) |
| Storage | Cloudflare R2 (AWSSDK.S3 compatible) |
| Email | Resend |
| Hosting API | Railway |
| Hosting FE | Vercel (wildcard DNS `*.tuplataforma.com`) |
| QR generation | QRCoder (.NET) |
| PDF generation | PdfSharp (.NET) |

## Agent workflow

Este proyecto usa el pipeline de agentes definido en `.claude/agents/` y los comandos en `.claude/commands/`.

### Roles

| Agent | Rol | Cuándo interviene |
|-------|-----|-------------------|
| FA (functional-analyst) | Escribe historias de usuario | Al inicio de cada feature |
| PO (product-owner) | Prioriza y aprueba | Después del FA y al final del ciclo |
| ARCH (architect) | C4 + ADRs | Al inicio del proyecto y si hay impacto arquitectónico |
| UX (ux-ui-designer) | Design specs | Si la historia tiene UI visible |
| TL (technical-lead) | Plan técnico | Antes de cualquier implementación |
| DEV (developer) | Implementa | Con plan técnico aprobado |
| QAA (qa-automation) | Tests automatizados | Después del DEV |
| QAF (qa-functional) | QA funcional | Después del QAA |
| TW (technical-writer) | Docs | Al cierre de sprint |
| RM (release-manager) | Releases | Solo cuando el usuario lo pide |

### Commands

- `/prime` — Leer contexto del proyecto y reportar estado actual
- `/orchestrate {descripción}` — Pipeline completo para una historia nueva

### Pipeline settings (`.claude/settings.json`)

- `pipeline.mode`: `with-checkpoints` — el usuario confirma en cada fase
- `pipeline.devPlanReview`: `true` — DEV produce planes antes de implementar
- `git.pushPolicy`: `manual` — nunca push automático
- `git.baseBranch`: `main`
- `git.integrationBranch`: `develop`

## Branch naming

```
feature/US-{N}-{short-title}
fix/US-{N}-{short-title}
release/{version}
```

## Commit format (Conventional Commits)

```
feat(US-N): descripción imperativa concisa
fix(US-N): descripción del fix
refactor(US-N): descripción
docs(US-N): descripción
```

## Critical rules

1. **DEV nunca pushea** sin que el usuario lo confirme (`pushPolicy: manual`)
2. **DEV nunca hace merge** — solo el RM mergea a `main` o `develop`
3. **DEV no empieza** sin `technical-plan.md` aprobado por el TL
4. **ARCH es obligatorio** al inicio del proyecto (baseline C4 + ADRs fundacionales)
5. **Sin NgModules** en Angular — siempre standalone components
6. **AsNoTracking** siempre en queries de lectura EF Core
7. **UUID** como PK en todas las tablas (nunca int)
8. **Multitenancy by slug** — toda query pública filtra por `conferencia.slug`
9. **ISR revalidation** — el backend llama el endpoint `/api/revalidate` de Next.js tras cambios relevantes
10. **encuesta_url** es un campo libre en sesiones (URL externa, no hay forms propios)

## Key domain concepts

- **Congreso**: entidad central. `slug` = subdominio. `admin_token` = acceso del organizador sin login.
- **Expositor**: accede via `token_acceso` (link mágico). Sube material. Ve su logística.
- **Participante**: registrado por el organizador. Flag `puede_generar_certificado` activa descarga de PDF.
- **Sesion**: tiene sala, expositor, horario, track, `encuesta_url` (link externo, opcional), `qr_code_url`.
- **Certificado**: el participante ingresa email (verificado contra la BD) + nombre → descarga PDF.
- **AvisoUrgente**: banner en el mini-sitio, polling 30s. Canal de notificación principal durante el evento.

## Artifact locations

```
docs/
├── backlog/
│   └── product-backlog.md
├── stories/
│   └── US-{N}/
│       ├── story.md
│       ├── technical-plan.md
│       ├── implementation-plan-{NN}.md
│       ├── implementation-notes.md
│       ├── test-plan.md
│       ├── qa-automation-report.md
│       ├── qa-functional-report.md
│       └── po-review.md
├── architecture/
│   ├── c4-context.md
│   ├── c4-container.md
│   ├── c4-component.md
│   └── adr/
│       └── ADR-{NNN}-{title}.md
├── design/
│   └── design-baseline.md
├── onboarding/
│   └── dev-guide.md
└── risks/
    └── risk-register.md
```

## Language policy

- Código (variables, funciones, clases): **English**
- Documentación de agentes (stories, ADRs, plans): **Español**
- Commits: **English** (Conventional Commits)
- UI visible al usuario final: **Español**
