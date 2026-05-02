# US-7: Mini-sitio home + programa público

## Descripción

Como visitante de un congreso, quiero ver la home y programa del evento en un sitio público accesible via subdominio dinámico (`{slug}.tuplataforma.com`). Sin login requerido.

## Criterios de aceptación

### AC1: Home página pública
- Next.js página `/` (root)
- Muestra nombre, descripción, fechas, venue, branding (colores, logo)
- Link a `/programa`
- Estático (SSG con ISR)

### AC2: Programa (agenda) página
- Next.js página `/programa`
- Lista sesiones del congreso por fecha (ordenadas)
- Filtros: por track, por expositor
- Muestra sala, horario, expositor, track
- Link a detalle sesión `/s/{id}`
- Estático con ISR 60s

### AC3: Backend endpoints públicos
- `GET /api/public/{slug}` → info conferencia (nombre, descripcion, fechas, branding, etc)
- `GET /api/public/{slug}/programa` → sesiones + salas + expositores (denormalizadas)
- `GET /api/public/{slug}/expositores` → lista expositores con bio, foto
- Caché: 5 min server-side (opcional Redis)

### AC4: Middleware Next.js
- Extrae `{slug}` del host (`{slug}.tuplataforma.com`)
- Inyecta en headers/context para que páginas accedan
- Fallback a localhost:3000 local dev

## Notas

- **Sitio único**: Un deploy Next.js para todos los congresos (multitenancy by hostname)
- **Branding dinámico**: CSS variables para color primario/secundario, tipografía
- **Sesiones públicas**: Solo si conferencia.Estado == "Publicado"
- **Mini-sitio scope**: Solo lectura pública. Edición sigue en admin panel.

## Tamaño

**Large** — 3-4 horas. Middleware, 3 páginas, 3 endpoints backend, branding dinámico.

## Dependencias

- US-5, US-6 (sesiones y publicado)
