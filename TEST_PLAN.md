# Test Plan — End-to-End

## Prerequisites

### Terminal 1: Backend
```bash
cd backend
dotnet run
# Listens on http://localhost:5000
```

### Terminal 2: Next.js Site
```bash
cd site
npm run dev
# Listens on http://localhost:3000
```

### Terminal 3: Angular Admin
```bash
cd admin
ng serve
# Listens on http://localhost:4200
```

## Test Flow

### 1. Register & Login
- http://localhost:4200/registro
- Email: test@example.com, Password: Test@1234
- → Redirects to dashboard

### 2. Create Congreso
- Click "Nuevo Congreso"
- Name: "MyConf 2026"
- Slug: "myconf" (auto-filled)
- Dates: 2026-05-10 to 2026-05-12
- Logo URL: (optional)
- → Creates congreso, estado = Borrador

### 3. Add Salas
- Navigate to /congreso/:id/salas
- Add: "Sala A", "Sala B" (capacity optional)

### 4. Add Expositores
- Navigate to /congreso/:id/expositores
- Add: "Juan Pérez", "María López" (email, bio optional)
- → TokenAcceso auto-generated

### 5. Add Sesiones
- Navigate to /congreso/:id/sesiones
- Add sesion: "Intro to React", Sala A, Juan, 2026-05-10, 10:00-11:00
- → Creates sesion

### 6. Publish Congreso
- Back to congreso detail (/congreso/:id/configuracion)
- Click "Publicar" button
- Confirm dialog
- → Estado = Publicado

### 7. View in Mini-Sitio
- Open http://myconf.localhost:3000 (or configure hosts file)
- Should see: hero + dates + venue + "Ver Programa" button
- Click "Ver Programa"
- → Lists sesiones with filters
- Click sesion → Detail page with expositor info

## Endpoints to Verify

### Admin API (auth required)
- POST /api/dashboard/conferencias (create)
- GET /api/dashboard/conferencias (list)
- GET /api/dashboard/conferencias/{id}
- PUT /api/dashboard/conferencias/{id}/publicar
- GET/POST/PUT/DELETE /api/dashboard/conferencias/{id}/salas
- GET/POST/PUT/DELETE /api/dashboard/conferencias/{id}/expositores
- GET/POST/PUT/DELETE /api/dashboard/conferencias/{id}/sesiones

### Public API (no auth)
- GET /api/public/{slug} → ConferenciaPublicaDto
- GET /api/public/{slug}/programa → List<SesionPublicaDto>
- GET /api/public/{slug}/sesiones/{id} → SesionPublicaDto
- GET /api/public/{slug}/expositores → List<ExpositorPublicoDto>

## Known Issues During Test

1. **CORS errors**: Backend must have localhost:3000 in allowed origins (just fixed)
2. **Slug mismatch**: Use lowercase slug in URL (myconf, not MyConf)
3. **Next.js CSR**: Slow first load (no ISR yet)
4. **Localhost subdomains**: Edit /etc/hosts or use ngrok for testing

## Success Criteria

- [ ] Register & login works
- [ ] Create congreso (Borrador state)
- [ ] Add salas, expositores, sesiones
- [ ] Publish congreso (state → Publicado)
- [ ] Home page visible at slug.localhost:3000
- [ ] Programa page shows sesiones with filters
- [ ] Sesion detail page shows expositor info
- [ ] No CORS errors in browser console
