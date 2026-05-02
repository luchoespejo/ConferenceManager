# Docker Setup — ConferenceManager

## Quick Start

```bash
# Build y run todo
docker-compose up --build

# O solo run (si ya está buildeado)
docker-compose up
```

Esperar ~30s para que levante todo. Luego acceso:

- **Backend**: http://localhost:5000
- **Admin**: http://localhost:4200
- **Site**: http://localhost:3000
- **DB**: localhost:5432 (postgres/postgres)

---

## Servicios

| Servicio | Puerto | Container | Comando |
|----------|--------|-----------|---------|
| PostgreSQL | 5432 | conference_db | postgres:16-alpine |
| Backend (.NET) | 5000 | conference_backend | `dotnet watch run` |
| Site (Next.js) | 3000 | conference_site | `npm run dev` |
| Admin (Angular) | 4200 | conference_admin | `ng serve --host 0.0.0.0` |

---

## Comandos útiles

```bash
# Ver logs de un servicio
docker-compose logs -f backend
docker-compose logs -f site
docker-compose logs -f admin

# Stop sin borrar volúmenes
docker-compose stop

# Stop + eliminar containers
docker-compose down

# Rebuild todo
docker-compose up --build

# Rebuild un servicio
docker-compose up --build backend

# Ejecutar comando en container
docker-compose exec backend dotnet test ../backend.tests

# Ver estado
docker-compose ps
```

---

## Volúmenes y Binds

- `./backend` → `/app` (live reload con `dotnet watch`)
- `./site` → `/app` (live reload con `npm run dev`)
- `./admin` → `/app` (live reload con `ng serve`)
- `postgres_data` → `/var/lib/postgresql/data` (datos persistentes)

Cambios en código se reflejan en vivo (excepto Admin que a veces necesita rebuild).

---

## Variables de entorno

Configuradas en `docker-compose.yml`:

```yaml
# Backend
ASPNETCORE_ENVIRONMENT: Development
Jwt__SecretKey: "..." (dev only, unsafe)
ConnectionStrings__DefaultConnection: "Host=postgres;..."
App__SiteUrl: "http://localhost:3000"

# Site
NEXT_PUBLIC_API_URL: "http://localhost:5000"
```

Para producción:
1. Cambiar `ASPNETCORE_ENVIRONMENT` → `Production`
2. Usar `.env.production` con valores reales
3. Cambiar Jwt__SecretKey a algo seguro

---

## Troubleshooting

### "Port already in use"
```bash
# Ocupado por proceso local
lsof -i :5000    # Backend
lsof -i :3000    # Site
lsof -i :4200    # Admin
lsof -i :5432    # DB

# Kill proceso
kill -9 <PID>

# O cambiar puerto en docker-compose.yml (left:right)
ports:
  - "5001:5000"  # Ahora Backend en 5001
```

### "Cannot connect to Docker daemon"
- Asegurar Docker Desktop levantado (Windows/Mac)
- En Linux: `sudo systemctl start docker`

### Backend crash en inicio
```bash
# Ver logs
docker-compose logs backend

# Common: DB no lista
# Solución: Docker espera healthcheck. Verificar postgres está up:
docker-compose ps  # Ver estado de postgres
```

### Volúmenes no actualizan código
- Backend: `dotnet watch` debería detectar cambios
- Site/Admin: A veces necesitan rebuild
  ```bash
  docker-compose up --build site
  docker-compose up --build admin
  ```

### Database no persiste entre restarts
- Verificar volumen creado:
  ```bash
  docker volume ls | grep conference
  ```
- Para borrar TODO (incluido DB):
  ```bash
  docker-compose down -v
  ```

---

## Testing

```bash
# Run tests (inside backend container)
docker-compose exec backend dotnet test ../backend.tests

# Or desde host (si dotnet instalado)
cd backend.tests && dotnet test
```

---

## Production Setup

1. **Reemplazar secrets**:
   - Cambiar `Jwt__SecretKey` a valor seguro
   - Usar `.env.production` (no en repo)

2. **Cambiar a Release mode**:
   ```yaml
   environment:
     ASPNETCORE_ENVIRONMENT: Production
   ```

3. **Cambiar URLs públicas**:
   ```yaml
   environment:
     App__BaseUrl: "https://api.midominio.com"
     App__SiteUrl: "https://midominio.com"
     NEXT_PUBLIC_API_URL: "https://api.midominio.com"
   ```

4. **Usar imagen builder**:
   - Backend: Multi-stage build (ya en Dockerfile)
   - Site: Multi-stage build (ya en Dockerfile)
   - Admin: Multi-stage build (ya en Dockerfile)

5. **Orquestación** (Kubernetes, Swarm, etc.):
   - Usar imágenes pre-built
   - Pasar secrets via env vars o secret stores
   - Configurar ingress/load balancer

---

*Última actualización: 2026-05-02*
