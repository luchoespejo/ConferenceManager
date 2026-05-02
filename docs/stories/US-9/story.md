# US-9: Generación de QRs por sesión

**Épica**: E4 (QRs y certificados)  
**Prioridad**: 🔴 Alta  
**Tamaño**: M  
**Estado**: Ready  
**Dependencias**: US-5 (Sesiones)

---

## Valor de negocio

Como organizador de congresos,  
Quiero que cada sesión tenga un código QR único generado automáticamente,  
Para que los participantes puedan escanear y acceder a la sesión sin escribir URLs.

---

## Criterios de aceptación

### CA1: Generar QR al crear sesión
- Al crear una sesión (POST), backend genera automáticamente QR
- QR apunta a: `{NEXT_PUBLIC_BASE_URL}/s/{sesionId}`
- URL guardada en `sesion.qr_code_url` (base64 o R2 URL)
- No bloquea creación; si falla, loguea error y continúa

### CA2: Generar QR al editar sesión
- Al editar sesión (PUT), si `qr_code_url` es null, genera nuevo QR
- Si ya existe, no regenera (evita churn)

### CA3: Mostrar QR en página pública
- Sesion detail Next.js muestra botón "Ver QR"
- QR en modal/popup o en PDF (si es imagen)
- Descargable como PNG

### CA4: Mostrar QR en admin (opcional)
- Admin sesion-detail muestra QR generado (preview)

---

## Notas técnicas

- **QRCoder**: NuGet package para generación
- **Almacenamiento**: Base64 en DB (pequeño) O R2 URL (cloud)
- **Content-Type**: `image/png` o `image/svg+xml`
- **Size**: Estándar (v5 o v6 QR code)

---

## Tareas

- [ ] Backend: QR service + GenerateQrAsync
- [ ] Backend: Inyectar en SesionService + CreateAsync / UpdateAsync
- [ ] Backend: Test generación
- [ ] Frontend Next.js: Mostrar QR en sesion detail (modal o link)
- [ ] Admin: Mostrar preview QR (opcional, puede ser future)
- [ ] E2E test: Create sesión → Scan QR → Llega a página

---

*Escrito: 2026-05-02*
