# Implementation Notes — US-7

**Date:** 2026-05-02
**Branch:** feature/US-7-mini-sitio

## Archivos creados/modificados

### Backend

- `backend/DTOs/Public/ConferenciaPublicaDto.cs` — info pública (nombre, descripcion, fechas, branding)
- `backend/DTOs/Public/SesionPublicaDto.cs` — sesion + sala/expositor nombres denormalizados
- `backend/DTOs/Public/ExpositorPublicoDto.cs` — expositor info + redesSociales
- `backend/Services/IPublicService.cs` + `PublicService.cs` — GetConferenciaBySlugAsync, GetProgramaBySlugAsync, GetExpositorsBySlugAsync
- `backend/Controllers/PublicConferenciasController.cs` — 3 endpoints sin auth
- `backend/Program.cs` — registrado IPublicService en DI

### Endpoints

- `GET /api/public/{slug}` — ConferenciaPublicaDto
- `GET /api/public/{slug}/programa` → List<SesionPublicaDto>
- `GET /api/public/{slug}/expositores` → List<ExpositorPublicoDto>
- Todos filtran por `Estado == Publicado`

### Next.js Site

- `site/middleware.ts` — ya existente, extrae slug del host
- `site/app/page.tsx` — home: hero + branding + venue info + link a programa
- `site/app/programa/page.tsx` — lista sesiones, filtros por track/expositor
- `site/app/s/[id]/page.tsx` — detalle sesion + expositor info + encuesta/QR links
- `site/.env.local` — NEXT_PUBLIC_API_URL=http://localhost:5000

## Decisiones técnicas

- **CSR en Next.js**: Todas las páginas `'use client'` (fetches en useEffect). Alternativa: SSR con fetch en layout (más compacto).
- **Slug extraction**: Middleware ya injecta en headers; páginas extraen del hostname directo en useEffect.
- **Multitenancy**: Hostname → slug → API calls con slug param
- **Validación**: Backend solo retorna si Estado == Publicado
- **Fallback localhost**: Si slug es 'localhost', 'www', 'tuplataforma' → default a 'demo'

## Cómo probar

```bash
# Terminal 1: backend
cd backend && dotnet run
# Terminal 2: Next.js
cd site && npm run dev
# Terminal 3: crear data (via postman/curl)
POST http://localhost:5000/api/dashboard/conferencias (crear conferencia Borrador)
POST /api/dashboard/conferencias/{id}/sesiones (crear sesion)
PUT /api/dashboard/conferencias/{id}/publicar (publicar)
# Browser
http://localhost:3000 → home (vacío si slug no es demo)
http://demo.localhost:3000 → home (si creaste congreso con slug=demo)
```

## Known issues

- Sesion detail page: fetches programa entero, busca sesion por id. Mejor: endpoint specific GET /api/public/{slug}/sesiones/{id}
- CORS: Backend probablemente bloqueará localhost:3000. Agregar en Program.cs.
- ISR: No implementado (fallback a CSR). Para producción: implementar ISR con revalidate tags.

## Pendiente (US-8)

- Mejor sesion detail page (endpoint specific)
- Encuestas reales (ahora solo link externo)
- Certificados (participante flow)
