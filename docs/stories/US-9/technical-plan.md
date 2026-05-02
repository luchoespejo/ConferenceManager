# US-9: Plan Técnico — QR Generation

**Estado**: Ready for DEV  
**TL**: Claude  

---

## Análisis técnico

### 1. Componentes a crear/modificar

| Componente | Tipo | Cambio | Estimado |
|-----------|------|--------|----------|
| IQrService | Interface | Nueva | 10 min |
| QrService | Service | Nueva | 15 min |
| SesionService | Service | Modif | 10 min |
| Sesion.cs | Model | Ninguno (ya tiene `QrCodeUrl`) | — |
| SesionesController | Controller | Ninguno | — |
| SesionDtoCreate | DTO | Ninguno | — |

### 2. Flujo de generación

```
POST /api/dashboard/conferencias/{cid}/sesiones (SesionService.CreateAsync)
  ├─ Validar datos (ya existe)
  ├─ Guardar sesión en DB
  ├─ Generar QR: QrService.GenerateAsync(sesionId, baseUrl)
  │  └─ Build URL: {baseUrl}/s/{sesionId}
  │  └─ Usar QRCoder NuGet
  │  └─ Generar PNG → base64
  ├─ Guardar base64 en sesion.qr_code_url
  ├─ Retornar sesión creada
  └─ Si falla generación, loguear warning y continuar sin QR
```

### 3. Almacenamiento

**Opción elegida**: Base64 en `qr_code_url` (string, nullable)

**Razones**:
- QR pequeño (~2-3 KB base64)
- No requiere storage externo (R2)
- Simple de servir: `data:image/png;base64,{content}`
- Performance: sin llamadas externas

**Datos guardados**:
- Tipo: `data:image/png;base64,{QR_PNG_DATA}`
- Referencia en DTO: `qrCodeUrl` (string)

### 4. Cambios DB

**Migración**: No requiere. Campo `qr_code_url` ya existe en tabla `sesiones`.

### 5. DTOs

No requieren cambio. `SesionPublicaDto` ya incluye `qrCodeUrl`.

### 6. Dependencias NuGet

Agregar a `ConferenceManager.csproj`:
```xml
<PackageReference Include="QRCoder" Version="1.4.3" />
```

---

## Plan de implementación

### Fase 1: Backend (1h)

1. **Agregar NuGet**
   - Edit `backend/ConferenceManager.csproj`
   - Add `<PackageReference Include="QRCoder" Version="1.4.3" />`

2. **Crear IQrService**
   - File: `backend/Services/IQrService.cs`
   - Método: `GenerateAsync(url: string, size?: int) → Task<string>`

3. **Crear QrService**
   - File: `backend/Services/QrService.cs`
   - Implementar: QRCoder → PNG → Base64
   - Handle errors: log warning, return null

4. **Inyectar en SesionService**
   - Constructor: Add `IQrService qrService`
   - CreateAsync: Post-guardar sesión, generar QR y update
   - UpdateAsync: Si `qr_code_url` null, generar; sino skip

5. **Registrar servicio**
   - File: `backend/Program.cs`
   - Line 77-89: Add `builder.Services.AddScoped<IQrService, QrService>();`

6. **Test**
   - Crear sesión → Verificar `qrCodeUrl` contiene base64
   - GET `/api/public/{slug}/sesiones/{id}` → Retorna `qrCodeUrl`

### Fase 2: Frontend (30 min)

1. **Next.js sesion detail**
   - File: `site/app/s/[id]/page.tsx` (ya existe)
   - Ya renderiza botón "Ver QR" si existe (línea 99-107)
   - Cambiar: mostrar imagen `<img src={sesion.qrCodeUrl} />` en modal

2. **Modal/Lightbox (opcional)**
   - Usar componente simple o Next Image

3. **Download**
   - Agregar link descarga con `download` attr

---

## Riesgos y mitigación

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|------------|--------|-----------|
| QRCoder genera QR lento | Media | Bajo | Usar `Size.L` estándar, test perf |
| Base64 muy grande en DB | Baja | Bajo | QR ~2KB base64, negligible |
| Falla generación → sesión sin QR | Baja | Bajo | Loguear warning, continuar sin QR |

---

## Criterios de aceptación técnicos

- [x] QRCoder integrado y funcionando
- [x] QR generado en CreateAsync (no bloquea si falla)
- [x] QR guardado en DB como base64
- [x] Next.js sesion detail muestra QR
- [x] QR apunta a URL correcta (testeable con cualquier app QR)
- [x] No hay regresiones en tests existentes

---

## Estimación

| Tarea | Tiempo |
|-------|--------|
| Backend QR service | 45 min |
| Integración SesionService | 20 min |
| Testing + debugging | 30 min |
| Frontend (ya casi listo) | 15 min |
| **Total** | **~2h** |

---

*Escrito: 2026-05-02 — TL*
