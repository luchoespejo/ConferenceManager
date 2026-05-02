# Test Instructions — ConferenceManager (2026-05-02)

## Quick Start

### Terminal 1: Backend
```bash
cd backend
dotnet run
# Esperado: "Now listening on: http://localhost:5000"
```

### Terminal 2: Next.js (Mini-sitio)
```bash
cd site
npm run dev
# Esperado: "▲ Next.js 14.x ready on http://localhost:3000"
```

### Terminal 3: Admin (Angular)
```bash
cd admin
ng serve
# Esperado: "✔ Compiled successfully. Watching for file changes..."
```

### Terminal 4: Tests
```bash
# Run test script
bash TEST_BACKEND.sh

# Or manual curl tests (one by one):
curl http://localhost:5000/api/health
```

---

## Test Cases

### 1. QR Generation (US-9)
**Scenario**: Create sesión → Verify QR generated

```bash
# 1. Register + Login → get TOKEN
# 2. Create conferencia → get CONF_ID
# 3. Create sala → get SALA_ID
# 4. Create expositor → get EXPO_ID
# 5. Create sesión → check response.data.qrCodeUrl contains "data:image/png;base64,"
```

**Expected**: 
- Sesión creada con `qrCodeUrl` contiendo base64 PNG data
- Endpoint retorna QR válido

### 2. QR in Public API
**Scenario**: Public endpoint includes QR code

```bash
# After creating sesión:
curl http://localhost:5000/api/public/testconf/sesiones/{sesionId}
# Check: response.qrCodeUrl is present and valid
```

### 3. QR in Next.js Page
**Scenario**: Visit sesión detail page, see QR

```bash
# 1. Navigate to http://localhost:3000/s/{sesionId}
# 2. Expected: Page loads with sesión info
# 3. Button "Ver QR" visible (or img src with base64)
# 4. (Manual) Scan QR with phone → Should point to public page URL
```

### 4. Test Runner (xUnit)
```bash
cd backend.tests
dotnet test
# Expected: 3/3 tests pass (QrServiceTests)
```

---

## Configuration

### Backend
- **Port**: 5000 (changed from 5233)
- **JWT Secret**: set in `appsettings.Development.json`
- **DB**: PostgreSQL @ localhost (default)
- **Email**: Fake (logs to console)

### Frontend
- **Admin**: localhost:4200
- **Site**: localhost:3000 (with wildcard subdomain support disabled in dev)

---

## Troubleshooting

### Backend fails to start
- Check `appsettings.Development.json` has Jwt section
- Verify PostgreSQL running: `psql -U postgres`
- Check port 5000 not in use: `netstat -an | grep 5000`

### Next.js can't reach backend
- Ensure CORS enabled: check `Program.cs` has `UseCors("AllowAdminClient")`
- Backend must listen on 5000
- Check `site/.env.local` has `NEXT_PUBLIC_API_URL=http://localhost:5000`

### Database issues
- Create DB: `createdb conference_db -U postgres`
- Migrations auto-run on startup (EF Core)

---

## What Was Built (This Session)

### US-9: QR Generation ✅
- QRCoder NuGet integrated
- `IQrService` + `QrService` creates base64 PNG QRs
- `SesionService.CreateAsync` generates QR post-save
- QR URLs: `{App:SiteUrl}/s/{sesionId}`
- Tests: 3/3 passing (QrServiceTests)
- Next.js already shows QR (optimized endpoint)

### US-10: Participant Management 📋
- Story + Technical Plan documented
- Ready for implementation (not started)

### Fixes 🔧
- Migration Designer files: added `using Microsoft.EntityFrameworkCore.Migrations`
- ServiceResult<T> usage fixed across services
- DTOs cleaned: removed `QrCodeUrl` input fields
- LaunchSettings: changed port 5233 → 5000

---

## Next Steps

1. **Run full E2E test**: bash TEST_BACKEND.sh
2. **Manual QR verification**: Scan generated QR with phone QR app
3. **Implement US-10** (Participants CRUD backend)
4. **Angular admin** (participant list + forms)
5. **E2E tests** for full flow

---

*Last updated: 2026-05-02 — Claude*
