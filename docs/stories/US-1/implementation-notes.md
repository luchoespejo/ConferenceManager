# Implementation Notes — US-1: Registro y login de organizadores

**Date:** 2026-04-26
**Developer:** DEV
**Technical plan:** [technical-plan.md](./technical-plan.md)
**Implementation plan executed:** [implementation-plan-01.md](./implementation-plan-01.md)

## Completed steps

| Step | Files | Notes |
|------|-------|-------|
| 1 | backend/ scaffold | dotnet new webapi --use-controllers |
| 2 | Models/, Data/ | UUID PKs, Fluent API |
| 3 | Migrations/ | InitialAuth generada, no aplicada (sin PG local) |
| 4 | Services/JwtService.cs | HMAC-SHA256, CSPRNG refresh |
| 5 | Services/ResendEmailService.cs, FakeEmailService.cs | Fake loguea URL en dev |
| 6 | Services/AuthService.cs | ServiceResult<T>, timing-safe login |
| 7 | Controllers/AuthController.cs | 5 endpoints |
| 8 | Program.cs, appsettings.json | DI, JWT, CORS, Swagger |
| 9-12 | admin/ | Angular standalone, signals, interceptors, componentes |
| 13 | site/ | Next.js App Router + middleware slug |

## Deviations from the plan

- Angular Material no instalado via `ng add` (requiere interactividad TTY). Componentes usan HTML nativo. Agregar Material en US-2.
- `dotnet ef database update` no ejecutado — sin PostgreSQL en entorno de build. Migración existe, aplicar manualmente.

## Decisions made during implementation

- FakeEmailService loguea URL de verificación completa para desarrollo sin Resend.
- CORS en Development: AllowAnyOrigin para facilitar ng serve local.
- Refresh token almacenado como SHA-256 hex lowercase.

## Notes for QA

### Backend
```bash
cd backend
# Setear connection string en appsettings.json o env var:
# ConnectionStrings__Default="Host=localhost;Database=conference_db;Username=postgres;Password=postgres"
dotnet ef database update
dotnet run
# Swagger: http://localhost:5000/swagger
```

### Endpoints secuencia de prueba
1. POST /api/auth/registro — { email, password, nombre, organizacion }
2. Buscar "FAKE EMAIL" en logs para obtener token de verificación
3. GET /api/auth/verificar-email?token={token}
4. POST /api/auth/login — { email, password } → accessToken
5. POST /api/auth/refresh — { refreshToken }

### Angular
```bash
cd admin && npm install && ng serve
# http://localhost:4200
```

### Next.js
```bash
cd site && npm install && npm run dev
# http://localhost:3000
```
