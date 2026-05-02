# US-9: Test Plan — QR Generation

**Story**: Generación de QRs por sesión  
**Written**: 2026-05-02

---

## Test Cases

### TC-1: QR Generated on Session Create
**Given** organizador crea sesión con datos válidos  
**When** POST `/api/dashboard/conferencias/{cid}/sesiones`  
**Then**
- [ ] Sesión creada exitosamente
- [ ] Response contiene `data.qrCodeUrl` con valor base64
- [ ] `qrCodeUrl` comienza con `data:image/png;base64,`
- [ ] QR almacenado en DB (`sesion.qr_code_url`)
- [ ] QR apunta a URL correcta: `{App:SiteUrl}/s/{sesionId}`

**Implementation**: Unit test SesionService.CreateAsync

---

### TC-2: QR Accessible via Public API
**Given** sesión creada con QR  
**When** GET `/api/public/{slug}/sesiones/{id}`  
**Then**
- [ ] Response incluye `qrCodeUrl` con base64 data
- [ ] QR válido (decodificable)

**Implementation**: Integration test PublicService.GetSesionByIdAsync

---

### TC-3: QR Rendered in Next.js Page
**Given** usuario accede a página de sesión `/s/{id}`  
**When** página carga sesión detail  
**Then**
- [ ] Botón "Ver QR" visible (si `sesion.qrCodeUrl`)
- [ ] Click abre QR (modal, imagen, o link descarga)
- [ ] QR es escaneable (manual test con app QR scanner)

**Implementation**: Manual browser test

---

### TC-4: QR Generation Failure Handling
**Given** QRService falla (OOM, etc.)  
**When** SesionService.CreateAsync intenta generar QR  
**Then**
- [ ] Sesión creada sin QR (continúa sin bloquear)
- [ ] Warning logged con detalles del error
- [ ] `sesion.qrCodeUrl` es null
- [ ] Public API retorna sesión sin `qrCodeUrl`

**Implementation**: Unit test SesionService.CreateAsync (mock QrService.GenerateAsync returns null)

---

### TC-5: QR Persists on Session Update
**Given** sesión con QR existe  
**When** PUT `/api/dashboard/conferencias/{cid}/sesiones/{id}` (edita otros campos)  
**Then**
- [ ] `qrCodeUrl` no cambia
- [ ] Update no regenera QR

**Implementation**: Unit test SesionService.UpdateAsync

---

## Automated Tests

### Unit Tests (xUnit)

1. **QrService Tests**
   - `GenerateAsync_ValidUrl_ReturnsBase64` — valid QR data
   - `GenerateAsync_InvalidUrl_ReturnsNull` — handles errors gracefully

2. **SesionService Tests**
   - `CreateAsync_GeneratesQrCode` — QR generated post-save
   - `CreateAsync_QrFailure_ContinuesWithoutQr` — error doesn't block
   - `UpdateAsync_DoesNotRegenerateQr` — QR not updated on edit

3. **PublicService Tests**
   - `GetSesionByIdAsync_IncludesQrCodeUrl` — QR in response

---

## Manual Tests

1. **Browser Test**: Create sesión → View public page → Verify QR button visible + clickable
2. **QR Scanner Test**: Scan generated QR → Verify URL matches `{App:SiteUrl}/s/{id}`
3. **Error Simulation**: Manually break QrService → Create sesión → Verify continues without QR

---

## Acceptance Criteria Verification

| Criteria | Test Case | Status |
|----------|-----------|--------|
| CA1: Generate QR on create | TC-1 | Pending |
| CA2: No regenerate on update | TC-5 | Pending |
| CA3: Show QR in public page | TC-3 | Pending |
| CA4: Admin shows QR (optional) | Manual | Pending |

---

*Escrito: 2026-05-02 — QA*
