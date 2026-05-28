# Configurar dominio custom

Guía para conectar un dominio propio (ej: `miapp.dpdns.org`) al stack
Vercel (frontend) + Render (backend).

---

## Arquitectura objetivo

```
miapp.dpdns.org          → Vercel  (panel admin + mini-sitios públicos)
api.miapp.dpdns.org      → Render  (backend .NET)
```

> Los mini-sitios públicos de congresos siguen en su dominio Vercel original
> (`conference-manager-ten.vercel.app`) porque Vercel Free no soporta
> wildcard `*.miapp.dpdns.org` con DNS externo.

---

## 1. Cloudflare (DNS)

Mover los nameservers del registrador a Cloudflare para poder crear los
registros necesarios.

### Registros DNS

| Tipo  | Nombre | Contenido                          | Proxy    |
|-------|--------|------------------------------------|----------|
| A     | `@`    | `216.198.79.1` *(IP de Vercel)*    | DNS only |
| CNAME | `api`  | `tu-app.onrender.com`              | DNS only |
| TXT   | `_vercel` | valor que da Vercel al verificar | DNS only |

> ⚠️ Siempre **DNS only** (nube gris). Vercel y Render necesitan terminar
> SSL ellos mismos; con proxy activo (naranja) los certificados rompen.

---

## 2. Vercel

### Agregar dominio al proyecto `site`

Settings → Domains → Add → `miapp.dpdns.org`

Vercel pide un TXT de verificación:
```
Type: TXT
Name: _vercel
Value: vc-domain-verify=miapp.dpdns.org,XXXXXXXXXX
```
Agregarlo en Cloudflare. Vercel valida automáticamente en minutos.

### Variables de entorno

Settings → Environment Variables → agregar (scope: **Production**):

```
BACKEND_URL         = https://api.miapp.dpdns.org
NEXT_PUBLIC_API_URL = https://api.miapp.dpdns.org
```

Redesplegar después de guardar.

---

## 3. Render

### Agregar custom domain al servicio

Settings → Custom Domains → Add → `api.miapp.dpdns.org`

Render verifica automáticamente vía el CNAME que apunta a `*.onrender.com`.

### Variables de entorno (si aplica)

Si el backend necesita saber su URL pública, agregar:
```
App__BaseUrl = https://api.miapp.dpdns.org
```

---

## 4. Código — `site/proxy.ts`

El middleware lee el subdominio del hostname para enrutar mini-sitios de
congresos. El primer segmento del dominio base **debe estar en la lista de
exclusiones**, si no lo trata como slug de congreso y todo da 404.

```ts
// site/proxy.ts — línea ~25
if (['www', 'tuplataforma', 'localhost', 'conference-manager-irl1', 'miapp'].includes(slug)) {
  return NextResponse.next();
}
```

Agregar el primer segmento del nuevo dominio (ej: `devflux` para
`devflux.dpdns.org`, `miapp` para `miapp.dpdns.org`).

---

## 5. Render — Dockerfile

El Dockerfile raíz (`/Dockerfile`) ya copia los 3 proyectos .NET necesarios.
En Render:

- **Root Directory**: vacío (repo root)
- **Dockerfile Path**: `Dockerfile`

---

## Checklist rápido

- [ ] Nameservers del registrador apuntan a Cloudflare
- [ ] Registros DNS creados en Cloudflare (A + CNAME api + TXT _vercel)
- [ ] Dominio agregado en Vercel y muestra "Valid Configuration"
- [ ] Env vars `BACKEND_URL` y `NEXT_PUBLIC_API_URL` en Vercel → redeployed
- [ ] Custom domain en Render para `api.*`
- [ ] Primer segmento del dominio agregado en `site/proxy.ts`
- [ ] Push y esperar deploy automático
