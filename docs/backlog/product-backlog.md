# Product Backlog — ConferenceManager

_Última actualización: 2026-04-26 — Product Owner_

---

## Épicas

| ID | Épica | Fase |
|----|-------|------|
| E1 | Autenticación y gestión de organizadores | 1 |
| E2 | Gestión del congreso (CRUD core) | 1 |
| E3 | Mini-sitio público | 1 |
| E4 | QRs y certificados | 1 |
| E5 | Portal del expositor | 2 |
| E6 | Branding y comunicaciones | 2 |
| E7 | Comercial y monetización | 3 |

---

## Fase 1 — MVP

| ID | Historia | Épica | Prioridad | Tamaño | Estado | Dependencias |
|----|----------|-------|-----------|--------|--------|--------------|
| US-1 | Registro y login de organizadores | E1 | 🔴 Alta | M | Pendiente | — |
| US-2 | Crear y configurar un congreso | E2 | 🔴 Alta | L | Pendiente | US-1 |
| US-3 | Gestionar salas de un congreso | E2 | 🔴 Alta | S | Pendiente | US-2 |
| US-4 | Gestionar expositores de un congreso | E2 | 🔴 Alta | M | Pendiente | US-2 |
| US-5 | Gestionar sesiones de un congreso | E2 | 🔴 Alta | L | Pendiente | US-3, US-4 |
| US-6 | Publicar un congreso | E2 | 🔴 Alta | S | Pendiente | US-5 |
| US-7 | Mini-sitio: home y programa público | E3 | 🔴 Alta | L | Pendiente | US-6 |
| US-8 | Mini-sitio: página de sesión | E3 | 🔴 Alta | M | Pendiente | US-7 |
| US-9 | Generación de QRs por sesión | E4 | 🔴 Alta | M | Pendiente | US-5 |
| US-10 | Gestionar participantes del congreso | E2 | 🟡 Media | M | Pendiente | US-2 |
| US-11 | Generación de certificados PDF | E4 | 🟡 Media | M | Pendiente | US-10, US-8 |
| US-12 | Avisos urgentes en el mini-sitio | E2 | 🟡 Media | S | Pendiente | US-7 |
| US-13 | Baseline arquitectónico (C4 + ADRs) | E1 | 🔴 Alta | M | Pendiente | — |

---

## Fase 2 — Valor agregado

| ID | Historia | Épica | Prioridad | Estado |
|----|----------|-------|-----------|--------|
| US-14 | Email automático al expositor con token | E5 | 🟡 Media | Pendiente |
| US-15 | Portal del expositor: ver info y logística | E5 | 🟡 Media | Pendiente |
| US-16 | Portal del expositor: subir material | E5 | 🟡 Media | Pendiente |
| US-17 | Branding dinámico en mini-sitio | E6 | 🟡 Media | Pendiente |
| US-18 | Descarga de PDF con todos los QRs | E4 | 🟡 Media | Pendiente |
| US-19 | Vista Modo Evento en el admin | E2 | 🟡 Media | Pendiente |
| US-20 | Logística del expositor en admin | E5 | 🟡 Media | Pendiente |
| US-21 | Sponsors configurables | E2 | 🟢 Baja | Pendiente |

---

## Fase 3 — Comercial

| ID | Historia | Épica | Prioridad | Estado |
|----|----------|-------|-----------|--------|
| US-22 | Landing de venta | E7 | 🟡 Media | Pendiente |
| US-23 | Planes y pagos con MercadoPago | E7 | 🟡 Media | Pendiente |
| US-24 | Analytics: escaneos QR y encuestas | E7 | 🟢 Baja | Pendiente |
| US-25 | Dominio custom por congreso | E7 | 🟢 Baja | Pendiente |
| US-26 | Certificado con template personalizable | E4 | 🟢 Baja | Pendiente |

---

## Orden de ejecución Fase 1

```
US-13 (ARCH baseline)
  ↓
US-1 (Auth)
  ↓
US-2 (Crear congreso)
  ↓
US-3 + US-4 (Salas + Expositores — paralelo)
  ↓
US-5 (Sesiones)
  ↓
US-6 (Publicar)
  ↓
US-7 (Mini-sitio home + programa)
  ↓
US-8 + US-9 (Página sesión + QRs — paralelo)
  ↓
US-10 (Participantes)
  ↓
US-11 + US-12 (Certificados + Avisos — paralelo)
```

---

## Notas PO

- US-13 debe ejecutarse primero: establece el baseline de C4 y los ADRs fundacionales que el TL necesita para cada historia posterior.
- US-1 es prerequisito duro para todo el flujo de organizador.
- US-7 puede iniciarse en paralelo con US-6 si el backend ya tiene el endpoint `/api/public/{slug}`.
- El mini-sitio Next.js comparte el mismo repo que el admin pero es un deploy separado en Vercel.
