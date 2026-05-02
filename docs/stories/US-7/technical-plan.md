# Technical Plan — US-7: Mini-sitio home + programa público

**Estimated size**: Large  
**Effort**: 3-4 hours  
**Branch**: `feature/US-7-mini-sitio`

---

## Implementation Breakdown

### Backend (3 tasks)

1. **Create PublicConferenciasController**
   - Route prefix: `[Route("api/public/{slug}")]`
   - No auth required
   - Methods:
     - `GET /api/public/{slug}` → ConferenciaPublicaDto (nombre, descripcion, fechas, branding)
     - `GET /api/public/{slug}/programa` → List<SesionPublicaDto> (sesiones con sala/expositor nombres denormalizados)
     - `GET /api/public/{slug}/expositores` → List<ExpositorPublicoDto>

2. **Create DTOs for public API**
   - `ConferenciaPublicaDto` — nombre, descripcion, fechaInicio, fechaFin, venue info, branding (logo, colores, tipografia)
   - `SesionPublicaDto` — id, titulo, descripcion, fecha, horaInicio, horaFin, track, salaNombre, expositorNombre, encuestaUrl, qrCodeUrl
   - `ExpositorPublicoDto` — id, nombre, bio, fotoUrl, redesSociales

3. **Create public service method**
   - `IPublicService.GetConferenciaBySlugAsync(slug)` → ConferenciaPublicaDto
   - `IPublicService.GetProgramaBySlugAsync(slug)` → SesionesPublicas
   - `IPublicService.GetExpositorsBySlugAsync(slug)` → ExpositorPublicos
   - Validates conferencia.Estado == "Publicado"
   - Returns empty or 404 if not published

### Frontend — Next.js (4 tasks)

4. **Create middleware.ts**
   - Extracts `{slug}` from host (e.g., `miconferencia.tuplataforma.com` → `miconferencia`)
   - Injects slug into request headers/context
   - For localhost: reads from query param or defaults to test slug

5. **Create `/` (home) page**
   - Layout: hero + about + dates + venue + CTA to programa
   - Server Component (SSG)
   - Fetches `GET /api/public/{slug}` at build time (ISR revalidate 3600)
   - Displays branding (logo, colors via CSS variables)

6. **Create `/programa` (agenda) page**
   - Server Component (SSG with ISR 60)
   - Fetches `GET /api/public/{slug}/programa`
   - List sesiones grouped by date OR filterable list
   - Filters: track select, expositor select
   - Each sesion card links to `/s/{id}`

7. **Create `/s/[id]` (sesion detail) page**
   - Server Component (ISR 60)
   - Fetches sesion details from programa endpoint
   - Shows: titulo, descripcion, expositor (bio, foto), sala, horario, track
   - Link to encuestaUrl if available
   - QR image embed (if qrCodeUrl provided)

### Configuration & Setup (2 tasks)

8. **Configure next.config.js**
   - Allow wildcard subdomains (local dev only via `.local`)
   - Environment vars for API base URL

9. **Environment setup**
   - `.env.local` with NEXT_PUBLIC_API_URL (defaults to http://localhost:5000)
   - vercel.json with wildcard domain config (production)

---

## Files to Create

### Backend

- `backend/Controllers/PublicConferenciasController.cs`
- `backend/Services/IPublicService.cs` + `PublicService.cs`
- `backend/DTOs/Public/ConferenciaPublicaDto.cs`
- `backend/DTOs/Public/SesionPublicaDto.cs`
- `backend/DTOs/Public/ExpositorPublicoDto.cs`

### Frontend (Next.js)

- `site/middleware.ts` — slug extraction
- `site/app/page.tsx` — home
- `site/app/programa/page.tsx` — agenda
- `site/app/s/[id]/page.tsx` — sesion detail
- `site/next.config.js` — config
- `site/.env.local` — env vars

---

## Blockers

None. Ready to start.

---

## Key Decisions

- **Multitenancy by hostname**: Single Next.js app, slug from subdomain. Fallback to localhost for dev.
- **ISR strategy**: Home 3600s, Programa/Sesion 60s (quick edits visible soon)
- **Public DTOs**: Denormalized (names embedded) to avoid N+1 queries
- **No auth**: All endpoints public (but only show if Estado == Publicado)
- **Branding**: CSS variables injected from API response
