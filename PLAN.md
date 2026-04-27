# ConferenceManager — Plan completo

---

## 1. Concepto general

SaaS multi-tenant para gestión de congresos. Un solo deploy de Next.js en Vercel
atiende todos los congresos dinámicamente via subdominio. Los cambios del organizador
en el admin impactan inmediatamente en el mini-sitio (sin deploy por congreso).

```
tuplataforma.com              → landing de venta
tuplataforma.com/registro     → registro de nuevos clientes
tuplataforma.com/login        → acceso clientes existentes
tuplataforma.com/dashboard    → panel del organizador
{slug}.tuplataforma.com       → mini-sitio público del congreso (dinámico)
```

**Cómo funciona un cambio:**
```
Organizador cambia sala de una sesión en el admin
  → Angular llama PUT /api/dashboard/.../sesiones/{id}
  → .NET actualiza PostgreSQL
  → (opcional) .NET llama revalidate endpoint de Next.js
  → Next.js invalida caché ISR de esa página
  → Próxima visita al mini-sitio ya muestra el cambio
  → Organizador puede publicar aviso urgente: "La charla X se mueve a Sala B"
  → Banner aparece en todo el mini-sitio en < 30 segundos (polling)
```

---

## 2. Stack

| Capa | Tecnología |
|------|-----------|
| API | .NET Core 8 Web API |
| BD | PostgreSQL |
| Admin panel | Angular 17+ |
| Mini-sitio | Next.js 14 (App Router, sitio único) |
| Storage | Cloudflare R2 |
| Email | Resend |
| Hosting API | Railway |
| Hosting FE | Vercel (wildcard DNS `*.tuplataforma.com`) |

---

## 3. Estructura de repos

```
ConferenceManager/
├── backend/    → .NET Core 8 Web API
├── admin/      → Angular (panel organizador)
└── site/       → Next.js (mini-sitio único para todos los congresos)
```

---

## 4. Flujos funcionales

### 4.1 — Cliente nuevo (organizador)

```
1. Entra a tuplataforma.com → ve pricing / features
2. Clic "Registrarse" → email + contraseña + nombre organización
3. Confirma email → accede al dashboard
4. Dashboard vacío → "Crear mi primer congreso"
5. Wizard de creación:
   a. Nombre, slug (= subdominio), descripción
   b. Fecha inicio / fin
   c. Branding: logo, colores, tipografía
   d. Venue: nombre, dirección, link Google Maps
6. Congreso en estado "Borrador"
7. Configura: salas → expositores → sesiones → sponsors
8. Cuando está listo → "Publicar"
   → Mini-sitio {slug}.tuplataforma.com activo
9. Descarga PDF con todos los QRs para imprimir
```

**Qué puede hacer el organizador:**
- CRUD de salas, expositores, sesiones, sponsors
- Cargar logística por expositor (hotel, llegada, fechas)
- Por sesión: pegar URL de encuesta externa (Google Form, Typeform, etc.) — opcional
- Gestionar participantes (registrar, marcar pago/invitado, habilitar certificado)
- Publicar avisos urgentes (aparecen como banner en el mini-sitio)
- Vista "Modo Evento": interfaz simplificada para cambios rápidos el día del evento
- Ver respuestas si usa encuesta propia (opcional, ver más abajo)
- Descargar PDF de QRs

**Cuando cambia algo urgente:**
```
1. Modifica en el admin (sala, horario, expositor)
2. Va a "Avisos urgentes" → crea: "La sesión X se mueve a Sala B, 15:30hs"
3. El banner aparece en el mini-sitio en < 30 segundos
4. El programa también muestra el dato actualizado (ISR revalida)
```

---

### 4.2 — Expositor

```
1. Organizador agrega expositor (nombre + email)
2. Sistema envía email:
   "Hola [nombre], fuiste cargado como expositor en [congreso].
    Tu área: tuplataforma.com/expositor/{token}"
3. Expositor entra sin contraseña (token en URL)
4. Ve en su portal:
   - Sus sesiones (sala, horario, track, QR individual)
   - Info logística (hotel, dirección Maps, fechas check-in/out, cómo llegar)
5. Puede subir material por sesión:
   - PDF → se sube a Cloudflare R2
   - Link a video (YouTube, Drive, etc.)
   - Link externo
```

**Info logística que carga el organizador por expositor:**
- Nombre del hotel
- Dirección + link Google Maps
- Info de llegada (texto libre)
- Fecha check-in / checkout
- Notas adicionales

---

### 4.3 — Participante en el evento

**Registro (configurable por organizador):**
```
Opción A — Pago: participante paga entrada → queda registrado con tipo "pago"
Opción B — Invitado: organizador lo registra manualmente como invitado
→ En ambos casos: flag "puede_generar_certificado = true" activable por el organizador
```

**Durante el evento (sin app, solo QRs):**
```
QR maestro (entrada del evento)
  → {slug}.tuplataforma.com/
  → Ve programa del día, salas, avisos urgentes en banner

QR por sesión (pegado en puerta de cada sala)
  → {slug}.tuplataforma.com/s/{sesionId}
  → Título, descripción, expositor, horario
  → Material descargable (PDF, video, links)
  → Botón "Agregar al calendario" (Google Calendar / iCal .ics)
  → Botón "Ir a la encuesta" (solo aparece si el organizador pegó una URL)
    → abre la URL externa (Google Form, Typeform, etc.) en nueva pestaña
  → Botón "Descargar certificado"
```

**Certificado PDF (MVP):**
```
→ {slug}.tuplataforma.com/certificado/{sesionId}
→ Participante ingresa su email
→ API verifica: email existe en participantes del congreso
         Y tiene "puede_generar_certificado = true"
→ Si ok → ingresa el nombre que quiere en el certificado
→ Genera PDF:
    - Logo del congreso
    - "Certifica que [nombre] participó en: [título sesión]"
    - Congreso: [nombre] — Fecha: [fecha sesión]
→ Descarga directa del PDF
→ Queda registro en tabla "certificados"
```

**Encuesta — modelo simplificado:**
```
La encuesta NO bloquea el certificado. Son independientes.
El organizador tiene una opción por sesión:
  → Pegar URL externa (Google Form, Typeform, lo que use)
  → El botón "Ir a la encuesta" aparece solo si hay URL cargada
  → Si no pega nada, no aparece el botón
No hay forms propios en el sistema en Fase 1.
```

---

## 5. Mini-sitio Next.js — cómo funciona

**Un solo deploy en Vercel** atiene todos los congresos.
El subdominio se extrae en el middleware y se usa para llamar a la API.

```typescript
// middleware.ts
export function middleware(req: NextRequest) {
  const host = req.headers.get('host') || ''
  const slug = host.split('.')[0]
  if (slug === 'www' || slug === 'tuplataforma') return NextResponse.next()
  const res = NextResponse.next()
  res.headers.set('x-conference-slug', slug)
  return res
}
```

**Páginas y estrategia de rendering:**

| Ruta | Rendering | Motivo |
|------|-----------|--------|
| `/` | SSG + ISR 60s | Home, countdown, sponsors. Cambia poco. |
| `/programa` | ISR 30s | Agenda. Puede cambiar durante el evento. |
| `/expositor/[id]` | SSR | Perfil. Se actualiza si el organizador edita. |
| `/s/[id]` | ISR 30s | Sesión + material. Puede cambiar en vivo. |
| `/certificado/[sesionId]` | CSR | Verificación email → generación PDF. |

**Revalidación al cambiar datos:**
```
Admin guarda cambio
  → .NET llama POST https://site.vercel.app/api/revalidate?path=/programa&secret=XXX
  → Next.js invalida caché de esa ruta
  → Próxima visita: dato fresco
```

**Features del mini-sitio:**
- Branding por congreso: CSS variables (`--color-primary`, `--color-secondary`, `--font`) inyectadas desde API
- Countdown dinámico hasta inicio del evento
- Programa filtrable por día, sala y track
- Estado sesiones: próxima / en curso / finalizada (actualización automática por hora o manual)
- Banner de avisos urgentes (polling 30s al endpoint `/api/public/{slug}/avisos`)
- Material descargable por sesión
- Agregar sesión a Google Calendar / descargar .ics
- Mapa/ubicación del venue
- Sponsors con logo y link
- Encuesta simple post-sesión
- Certificado PDF descargable

---

## 6. Modelo de datos — PostgreSQL

```sql
-- USUARIOS (organizadores)
CREATE TABLE usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  organizacion VARCHAR(255),
  email_verificado BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CONFERENCIAS
CREATE TABLE conferencias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  slug VARCHAR(100) UNIQUE NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  estado VARCHAR(20) DEFAULT 'borrador', -- borrador|publicado|finalizado
  -- branding
  logo_url TEXT,
  logo_secundario_url TEXT,
  banner_url TEXT,
  favicon_url TEXT,
  color_primario VARCHAR(7) DEFAULT '#3B82F6',
  color_secundario VARCHAR(7) DEFAULT '#1E40AF',
  tipografia VARCHAR(100) DEFAULT 'Inter',
  firma_url TEXT,
  -- venue
  venue_nombre TEXT,
  venue_direccion TEXT,
  venue_link_maps TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SALAS
CREATE TABLE salas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conferencia_id UUID REFERENCES conferencias(id) ON DELETE CASCADE,
  nombre VARCHAR(100) NOT NULL,
  capacidad INT
);

-- EXPOSITORES
CREATE TABLE expositores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conferencia_id UUID REFERENCES conferencias(id) ON DELETE CASCADE,
  nombre VARCHAR(255) NOT NULL,
  bio TEXT,
  foto_url TEXT,
  email VARCHAR(255),
  redes_sociales JSONB,
  token_acceso VARCHAR(100) UNIQUE NOT NULL DEFAULT gen_random_uuid()::text
);

CREATE TABLE logistica_expositores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expositor_id UUID REFERENCES expositores(id) ON DELETE CASCADE UNIQUE,
  nombre_hotel TEXT,
  direccion_hotel TEXT,
  link_maps_hotel TEXT,
  info_llegada TEXT,
  fecha_checkin DATE,
  fecha_checkout DATE,
  notas TEXT
);

-- SESIONES
CREATE TABLE sesiones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conferencia_id UUID REFERENCES conferencias(id) ON DELETE CASCADE,
  sala_id UUID REFERENCES salas(id),
  expositor_id UUID REFERENCES expositores(id),
  titulo VARCHAR(255) NOT NULL,
  descripcion TEXT,
  fecha DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  estado VARCHAR(20) DEFAULT 'proxima', -- proxima|en_curso|finalizada
  track VARCHAR(100),
  qr_code_url TEXT,
  encuesta_url TEXT  -- URL externa Google Form / Typeform (opcional)
);

CREATE TABLE materiales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sesion_id UUID REFERENCES sesiones(id) ON DELETE CASCADE,
  tipo VARCHAR(10) NOT NULL, -- pdf|video|link
  url TEXT NOT NULL,
  nombre VARCHAR(255)
);

-- PARTICIPANTES
CREATE TABLE participantes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conferencia_id UUID REFERENCES conferencias(id) ON DELETE CASCADE,
  nombre VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  tipo VARCHAR(20) DEFAULT 'invitado', -- pago|invitado
  monto_pagado DECIMAL(10,2),
  puede_generar_certificado BOOLEAN DEFAULT false,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CERTIFICADOS
CREATE TABLE certificados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participante_id UUID REFERENCES participantes(id),
  sesion_id UUID REFERENCES sesiones(id),
  nombre_en_certificado VARCHAR(255) NOT NULL,
  generado_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(participante_id, sesion_id)
);

-- SPONSORS
CREATE TABLE sponsors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conferencia_id UUID REFERENCES conferencias(id) ON DELETE CASCADE,
  nombre VARCHAR(255) NOT NULL,
  logo_url TEXT,
  link TEXT,
  orden INT DEFAULT 0
);

-- AVISOS URGENTES
CREATE TABLE avisos_urgentes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conferencia_id UUID REFERENCES conferencias(id) ON DELETE CASCADE,
  mensaje TEXT NOT NULL,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ÍNDICES
CREATE INDEX idx_conferencias_slug ON conferencias(slug);
CREATE INDEX idx_conferencias_usuario ON conferencias(usuario_id);
CREATE INDEX idx_sesiones_conferencia ON sesiones(conferencia_id);
CREATE INDEX idx_sesiones_fecha ON sesiones(fecha);
CREATE INDEX idx_expositores_token ON expositores(token_acceso);
CREATE INDEX idx_participantes_conferencia ON participantes(conferencia_id);
```

---

## 7. Endpoints API

### Auth
```
POST /api/auth/registro
POST /api/auth/login                → devuelve JWT
POST /api/auth/verificar-email
```

### Dashboard (JWT requerido)
```
GET/POST                 /api/dashboard/conferencias
GET/PUT                  /api/dashboard/conferencias/{id}
PUT                      /api/dashboard/conferencias/{id}/publicar
PUT                      /api/dashboard/conferencias/{id}/finalizar

GET/POST/PUT/DELETE      /api/dashboard/conferencias/{id}/salas
GET/POST/PUT/DELETE      /api/dashboard/conferencias/{id}/expositores
PUT                      /api/dashboard/conferencias/{id}/expositores/{expId}/logistica
GET/POST/PUT/DELETE      /api/dashboard/conferencias/{id}/sesiones
GET/POST/PUT/DELETE      /api/dashboard/conferencias/{id}/sponsors
GET/POST/PUT/DELETE      /api/dashboard/conferencias/{id}/avisos

GET/POST/PUT/DELETE      /api/dashboard/conferencias/{id}/participantes
GET                      /api/dashboard/conferencias/{id}/qrs/download   → PDF
```

### Público (mini-sitio)
```
GET  /api/public/{slug}
GET  /api/public/{slug}/programa        ?fecha=&sala=&track=
GET  /api/public/{slug}/expositores
GET  /api/public/{slug}/expositores/{id}
GET  /api/public/{slug}/sesiones/{id}
GET  /api/public/{slug}/sponsors
GET  /api/public/{slug}/avisos
```

### Certificados (público)
```
POST /api/certificados/verificar        → { sesionId, email } → ok/error
POST /api/certificados/generar          → { sesionId, email, nombre } → PDF stream
```

### Portal expositor
```
GET  /api/expositor/{token}
POST /api/expositor/{token}/sesiones/{id}/material
DELETE /api/expositor/{token}/sesiones/{id}/material/{mId}
```

### Revalidación (interno, llamado desde .NET)
```
POST /api/revalidate?path=/programa&secret={SECRET}   → endpoint Next.js
```

---

## 8. Angular — Admin Panel (rutas)

```
/login
/registro
/dashboard                               → mis congresos
/congreso/nuevo
/congreso/:id/overview
/congreso/:id/configuracion
/congreso/:id/branding
/congreso/:id/salas
/congreso/:id/expositores
/congreso/:id/expositores/:expId
/congreso/:id/sesiones
/congreso/:id/programa                   → grilla horaria
/congreso/:id/participantes
/congreso/:id/encuestas
/congreso/:id/encuestas/:eId/resultados
/congreso/:id/sponsors
/congreso/:id/avisos
/congreso/:id/qrs
/congreso/:id/modo-evento                → vista simplificada día del evento
```

---

## 9. Fases

### Fase 1 — MVP
- Auth organizadores (registro + login + JWT)
- CRUD completo: conferencias, salas, expositores, sesiones
- Campo `encuesta_url` por sesión (URL externa, sin forms propios)
- Mini-sitio: home, programa, página de sesión
- QRs individuales por sesión (PNG)
- Registro básico de participantes + flag `puede_generar_certificado`
- Certificado PDF MVP: verificación por email → descarga (nombre + sesión + logo)
- Avisos urgentes con banner en mini-sitio (polling 30s)

### Fase 2 — Valor agregado
- Email automático al crear expositor (link con token)
- Portal expositor: subida de material a R2
- Branding dinámico (CSS variables en mini-sitio)
- PDF de todos los QRs para imprimir
- Logística del expositor visible en su portal
- Vista Modo Evento
- Sponsors configurables

### Fase 3 — Comercial
- Landing de venta
- Planes y pagos (MercadoPago)
- Analytics: escaneos QR, respuestas encuestas
- Dominio custom por congreso (plan premium)
- Certificado con template personalizable + firma

---

## 10. Verificación por fase

**Fase 1:**
1. `dotnet run` → Swagger en `/swagger`
2. Registro + login → JWT válido
3. Crear congreso → slug único, visible en dashboard
4. CRUD salas / expositores / sesiones
5. `GET /api/public/{slug}/programa` → JSON correcto
6. `GET /api/sesiones/{id}/qr` → PNG escaneable
7. Angular: flujo completo crear → agregar sesiones → publicar
8. Next.js local (`/etc/hosts`): home y programa con branding del congreso
9. Participante: completar encuesta → generar certificado PDF descargable
10. Aviso urgente: creado en admin → banner visible en mini-sitio en < 30s
