# Design Spec — Responsive Mobile: Admin Panel + Public Site

**Date:** 2026-05-16
**Author:** UX/UI Designer
**Design baseline:** [design-baseline.md](./design-baseline.md)
**Scope:** Both frontends — `admin/` (Angular 17+, global SCSS) and `site/` (Next.js 14, Tailwind + inline styles)

---

## 0. Guiding principles

1. **Mobile-first within the breakpoint system.** All base rules already exist. Responsive rules are additive overrides at the breakpoints defined below.
2. **Preserve identity.** Dark navy palette (admin) and light neutral palette (site) do not change. Font sizes do not increase dramatically — the goal is layout adaptation, not visual redesign.
3. **44px minimum touch target** for every interactive element (buttons, links, toggles). This is a hard constraint.
4. **No horizontal overflow.** Every screen must fit within its viewport width without a scrollbar on the `body` or `html`.
5. **Admin:** changes land in `admin/src/styles.scss` as mobile-first media query additions at the bottom of the file. Component-level inline `style` attributes are replaced with class-based rules.
6. **Site:** changes land in `site/app/globals.css` as new utility classes; the layout component and page components replace inline `style` objects with `className` references to those classes.

---

## 1. Breakpoints

One set of breakpoints applies to both frontends. Admin uses them in SCSS. Site uses them via Tailwind custom screen tokens or plain CSS media queries in `globals.css`.

| Name | Min-width | Intent |
|------|-----------|--------|
| `mobile` | 0px | base (mobile-first) |
| `sm` | 480px | large phones, landscape |
| `md` | 768px | tablets |
| `lg` | 1024px | desktop (current layout is already correct at this size) |

**SCSS mixin to define once in `styles.scss`:**
```scss
@mixin sm  { @media (min-width: 480px)  { @content; } }
@mixin md  { @media (min-width: 768px)  { @content; } }
@mixin lg  { @media (min-width: 1024px) { @content; } }
```

**Tailwind config addition for the site (`tailwind.config.ts` or `@theme` in `globals.css`):**
```css
/* inside @theme inline block in globals.css */
--breakpoint-sm: 480px;
--breakpoint-md: 768px;
--breakpoint-lg: 1024px;
```
The existing Tailwind breakpoints (`sm: 640px`, `md: 768px`, `lg: 1024px`) are close enough for the site; only `sm` differs. Flag for TL whether to override Tailwind's `sm` or use a custom `xs` key.

---

## 2. Admin panel — component-by-component spec

### 2.1 Topbar (`.topbar`)

**Current behavior (desktop):** horizontal flex, `height: 64px`, brand on the left, `topbar-right` on the right. `topbar-right` contains 1–2 buttons.

**Mobile behavior (< 768px):**
- Height remains 64px — do not reduce; it is the hit target for the brand link.
- `.topbar-right` buttons are condensed: hide text labels on buttons that have both icon and text (e.g., "← Volver" → keep "←"). This avoids a hamburger menu entirely — the admin's `topbar-right` never exceeds 2 buttons, so full collapse is not needed.
- If `.topbar-right` contains more than 2 buttons on a given screen in the future, flag to the FA to reconsider the nav structure.
- `padding: 0 1rem` on mobile (was `0 2rem`).

```scss
/* In styles.scss — mobile-first topbar overrides */
@media (max-width: 767px) {
  .topbar {
    padding: 0 1rem;
  }
  .topbar-right .btn-label {   /* NEW: wrap button text in .btn-label in templates */
    display: none;
  }
  .topbar-right .btn {
    padding: .5rem .625rem;    /* slightly tighter, still ≥ 44px tall via height */
    min-height: 44px;
    min-width: 44px;
    justify-content: center;
  }
}
```

**Template change required:** In each component that renders a topbar, wrap the visible text of `.topbar-right` buttons in `<span class="btn-label">`. Example:
```html
<a class="btn btn-secondary btn-sm">
  ← <span class="btn-label">Volver</span>
</a>
```

**Flag for TL:** The `brand-name` text (`ConferenceManager`) may overflow on very narrow devices (320px). Consider truncating with `max-width: calc(100vw - 120px); overflow: hidden; text-overflow: ellipsis; white-space: nowrap` on `.brand-name` at mobile.

---

### 2.2 Page body (`.page-body`)

**Current:** `padding: 2rem`, `max-width: 1200px`.

**Mobile:**
```scss
@media (max-width: 767px) {
  .page-body {
    padding: 1rem;
  }
}
@media (min-width: 768px) and (max-width: 1023px) {
  .page-body {
    padding: 1.5rem;
  }
}
```

---

### 2.3 Page header (`.page-header`)

**Current:** `display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem`. Already has `flex-wrap: wrap` which gives partial responsiveness, but the action button stays inline and can be very wide.

**Mobile (< 480px):** Stack vertically, button(s) full width.

```scss
@media (max-width: 479px) {
  .page-header {
    flex-direction: column;
    align-items: stretch;
  }
  .page-header > .btn,
  .page-header > div > .btn {   /* for multi-button wrappers like participantes */
    width: 100%;
    justify-content: center;
  }
  /* The button wrapper div in participantes uses display:flex inline — it needs a class */
  .page-header-actions {        /* NEW class — add to the div wrapping multiple header buttons */
    display: flex;
    flex-direction: column;
    gap: .5rem;
    width: 100%;
  }
  .page-header-actions .btn {
    width: 100%;
    justify-content: center;
  }
}
```

**Template change required:** In `participantes.component.ts`, replace the `div` with `style="display:flex;gap:.5rem"` around the header buttons with `<div class="page-header-actions">`.

Visual result on mobile:
```
+-------------------------------+
| Participantes                 |
| 12 participantes registrados  |
+-------------------------------+
| [    Exportar CSV           ] |
| [    + Nuevo participante   ] |
+-------------------------------+
```

---

### 2.4 Form row (`.form-row`)

**Current:** `display: grid; grid-template-columns: 1fr 1fr; gap: 1rem`.

**Mobile (< 480px):** Single column.

```scss
@media (max-width: 479px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}
```

No template changes required. This is a pure CSS rule.

---

### 2.5 Form actions (`.form-actions`)

**Current:** `display: flex; gap: .75rem; justify-content: flex-end`.

**Mobile (< 480px):** Reverse the order so the primary CTA is on top (most prominent tap target), both buttons full width, stacked.

```scss
@media (max-width: 479px) {
  .form-actions {
    flex-direction: column-reverse;  /* primary CTA on top */
    gap: .625rem;
  }
  .form-actions .btn {
    width: 100%;
    justify-content: center;
    min-height: 44px;
  }
}
```

---

### 2.6 Item row (`.item-row`)

**Current:** `display: flex; align-items: center; gap: 1rem`. Children: `.item-avatar`, `.item-info` (flex: 1), `.item-actions` (flex-shrink: 0, display: flex, gap: .5rem).

**Mobile (< 480px):** Keep the avatar + name on the same horizontal line. Move actions below the info block. This prevents the row from becoming too tall while keeping the avatar as a visual anchor.

```scss
@media (max-width: 479px) {
  .item-row {
    flex-wrap: wrap;
    padding: .875rem 1rem;
  }
  .item-info {
    /* already flex: 1; min-width: 0 — no change needed */
  }
  .item-actions {
    width: 100%;
    margin-left: calc(40px + 1rem); /* align with item-info: avatar width + gap */
    padding-top: .5rem;
    border-top: 1px solid var(--border);
    margin-top: .25rem;
  }
  .item-actions .btn {
    min-height: 36px;    /* .btn-sm context — 36px acceptable since it sits below, not as a primary CTA */
    min-width: 44px;
  }
}
```

Visual result on mobile:
```
+----------------------------------------------+
| [AV]  Nombre del expositor                   |
|       cargo o subtítulo                      |
|       ─────────────────────────────────       |
|            [Editar]  [Eliminar]              |
+----------------------------------------------+
```

---

### 2.7 Data table (`.table-wrap` / `.table-wrapper`)

**Strategy:** Horizontal scroll on tablet (768px–1023px). Card-style row reformat on mobile (< 480px).

The card reformat uses CSS `display: block` on `thead`, `tbody`, `tr`, `th`, `td` with `data-label` attribute-based pseudo-elements for column headers. This requires a small template addition.

#### 2.7a Tablet (768px and below): horizontal scroll
The `.table-wrap` already has `overflow-x: auto`. Ensure the `table` inside has `min-width: 600px` so it can scroll smoothly:

```scss
@media (max-width: 1023px) {
  .table-wrap table,
  .table-wrapper table {
    min-width: 600px;
  }
}
```

#### 2.7b Mobile (< 480px): card rows

```scss
@media (max-width: 479px) {
  .table-wrap,
  .table-wrapper {
    border: none;
    border-radius: 0;
    overflow-x: visible;
  }
  .table-wrap table,
  .table-wrapper table {
    min-width: unset;
    width: 100%;
  }
  .table-wrap thead,
  .table-wrapper thead {
    display: none;          /* hide column headers — labels come from data-label */
  }
  .table-wrap tbody tr,
  .table-wrapper tbody tr {
    display: block;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-md);
    margin-bottom: .75rem;
    padding: .875rem 1rem;
  }
  .table-wrap tbody tr:hover td,
  .table-wrapper tbody tr:hover td {
    background: transparent; /* remove row hover — card hover is on the tr */
  }
  .table-wrap tbody tr:last-child td,
  .table-wrapper tbody tr:last-child td {
    border-bottom: none;
  }
  .table-wrap td,
  .table-wrapper td {
    display: flex;
    align-items: baseline;
    gap: .5rem;
    padding: .375rem 0;
    border-bottom: 1px solid var(--border);
    text-align: left !important;   /* override any inline text-align:center/right on td */
    font-size: .875rem;
  }
  .table-wrap td:last-child,
  .table-wrapper td:last-child {
    border-bottom: none;
    padding-top: .625rem;
    justify-content: flex-start;  /* action buttons left-aligned */
  }
  .table-wrap td::before,
  .table-wrapper td::before {
    content: attr(data-label);
    font-size: .75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: .06em;
    color: var(--muted);
    flex-shrink: 0;
    min-width: 90px;
  }
  /* Action cell: no label prefix, buttons inline */
  .table-wrap td.td-actions::before,
  .table-wrapper td.td-actions::before {
    display: none;
  }
  .table-wrap td.td-actions,
  .table-wrapper td.td-actions {
    gap: .5rem;
    flex-wrap: wrap;
  }
  .table-wrap td.td-actions .btn,
  .table-wrapper td.td-actions .btn {
    min-height: 36px;
    min-width: 44px;
  }
}
```

**Template change required:** Add `data-label` attributes to every `<td>` and the class `td-actions` to the actions column. Example for `participantes.component.ts`:

```html
<td data-label="Nombre">…</td>
<td data-label="Email">{{ p.email }}</td>
<td data-label="Empresa">{{ p.empresa || '—' }}</td>
<td data-label="Certificado" style="text-align:center">…</td>
<td class="td-actions">
  <div style="display:flex;gap:.5rem;justify-content:flex-end">…</div>
</td>
```

Visual result on mobile:
```
+----------------------------------------------+
| NOMBRE      [AV] María García                |
| EMAIL       maria@email.com                  |
| EMPRESA     Acme Corp                        |
| CERTIFICADO ✓                                |
|─────────────────────────────────────────────|
|  [Editar]  [Eliminar]                        |
+----------------------------------------------+
```

---

### 2.8 Buttons — minimum touch targets

All `.btn` already render at ~36px height via `padding: .5rem 1.125rem` with `line-height: 1.6`. On mobile, ensure 44px minimum:

```scss
@media (max-width: 767px) {
  .btn:not(.btn-sm) {
    min-height: 44px;
    padding: .625rem 1.125rem;
  }
  /* btn-sm used in tables and item-actions — keep at 36px but ensure 44px wide tap target via min-width */
  .btn-sm {
    min-width: 44px;
    min-height: 36px;
  }
}
```

---

### 2.9 Stats grid (`.stats-grid`)

**Current:** `repeat(auto-fill, minmax(180px, 1fr))`. Already responsive by nature. On narrow screens the `180px` minimum may force 1 column. No changes needed — `auto-fill` handles this correctly.

---

### 2.10 Cards grid (`.cards-grid`)

**Current:** `repeat(auto-fill, minmax(300px, 1fr))`. On mobile (< 480px), `300px` minimum forces a single column automatically. No changes needed.

---

### 2.11 Auth card (`.auth-card`)

**Current:** `max-width: 420px; padding: 2.5rem`. Already centered and `max-width` constrained. On very narrow screens (320px), the 2.5rem padding eats too much space:

```scss
@media (max-width: 479px) {
  .auth-card {
    padding: 1.5rem 1.25rem;
    border-radius: var(--r-md);  /* slightly less than --r-lg to feel less padded */
  }
}
```

---

### 2.12 Congreso overview / form panel

The `congreso-form` component is likely to use `.form-row` for fields like fecha-inicio / fecha-fin. The `.form-row` rule in §2.4 handles this. The form panel itself (`form-panel`) does not need changes — it is block-level and fills the available column.

---

## 3. Public site — component-by-component spec

The site uses a mix of Tailwind classes and inline styles. The strategy is:

- Convert inline `style` objects in `layout.tsx` and page components to className-based rules in `globals.css`.
- Use Tailwind responsive prefixes (`md:`, `lg:`) where the class already exists.
- Add custom classes in `globals.css` for cases where inline styles were used and Tailwind doesn't have a direct equivalent.

---

### 3.1 Navbar (layout.tsx)

**Current:** Inline `style` flex row, fixed 60px height, all links visible horizontally.

**Problem:** On mobile, the logo + conference name + 3 nav links + 1 badge-style link overflow horizontally. The navbar is rendered with runtime `background: primary` (dynamic), so we cannot use Tailwind color classes — the inline background color on `<nav>` must stay. Only layout properties move to CSS classes.

**Mobile behavior (< 768px):**
- Collapse the three text links ("Programa", "Expositores", "Certificado") into a hamburger/drawer OR stack below the brand row.
- Decision: **two-row layout** (no JavaScript drawer needed, simpler implementation). Row 1: brand. Row 2: nav links, centered, smaller text.
- This avoids requiring a new state variable and keeps the component simple.

```css
/* globals.css additions */
.site-nav {
  display: flex;
  align-items: center;
  height: 60px;
  padding: 0 1.5rem;
  gap: 1.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,.2);
  flex-wrap: wrap;       /* allow wrapping to second row */
}
.site-nav-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  color: #fff;
  flex-shrink: 0;
}
.site-nav-brand img {
  height: 36px;
  object-fit: contain;
}
.site-nav-brand-name {
  font-weight: 700;
  font-size: 1.05rem;
}
.site-nav-spacer {
  flex: 1;
}
.site-nav-links {
  display: flex;
  align-items: center;
  gap: 1.25rem;
}
.site-nav-link {
  color: rgba(255,255,255,.85);
  text-decoration: none;
  font-size: .9rem;
  font-weight: 500;
  white-space: nowrap;
  min-height: 44px;
  display: flex;
  align-items: center;
}
.site-nav-link-badge {
  background: rgba(255,255,255,.15);
  color: #fff;
  padding: 6px 14px;
  border-radius: 6px;
  text-decoration: none;
  font-size: .85rem;
  font-weight: 600;
  min-height: 44px;
  display: flex;
  align-items: center;
}

@media (max-width: 767px) {
  .site-nav {
    height: auto;
    padding: .625rem 1rem;
    gap: 0;
    flex-wrap: wrap;
  }
  .site-nav-brand {
    flex: 1;                /* takes up first row */
    min-height: 44px;
  }
  .site-nav-spacer {
    display: none;          /* not needed in two-row layout */
  }
  .site-nav-links {
    width: 100%;            /* forces to second row */
    justify-content: center;
    gap: 1rem;
    padding: .375rem 0 .5rem;
    border-top: 1px solid rgba(255,255,255,.12);
  }
  .site-nav-link,
  .site-nav-link-badge {
    font-size: .8rem;
  }
  .site-nav-brand-name {
    font-size: .95rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 55vw;
  }
}
```

Visual result on mobile:
```
+------------------------------------------+
| [LOGO] Nombre del Congreso               |
|  ─────────────────────────────────────   |
|  Programa   Expositores   [Certificado]  |
+------------------------------------------+
```

**Template change required in `layout.tsx`:** Replace the `<nav style={...}>` and its children with classNames using the classes above. The `background: primary` style attribute stays on the `<nav>` element directly. Example:

```tsx
<nav className="site-nav" style={{ background: primary }}>
  <Link href="/" className="site-nav-brand">
    {conf?.logoUrl && <img src={logoUrl} alt="Logo" />}
    <span className="site-nav-brand-name">{conf?.nombre || 'ConferenceManager'}</span>
  </Link>
  <div className="site-nav-spacer" />
  <div className="site-nav-links">
    <Link href="/programa" className="site-nav-link">Programa</Link>
    <Link href="/expositores" className="site-nav-link">Expositores</Link>
    <Link href="/certificado" className="site-nav-link-badge">Certificado</Link>
  </div>
</nav>
```

---

### 3.2 Aviso urgente banner

**Current:** `padding: 10px 1.5rem`. No changes needed — it is already full-width and wraps text naturally. Ensure `word-wrap: break-word` is set:

```css
.site-aviso-banner {
  background: #dc2626;
  color: #fff;
  padding: 10px 1rem;
  word-wrap: break-word;
}
@media (min-width: 768px) {
  .site-aviso-banner {
    padding: 10px 1.5rem;
  }
}
```

---

### 3.3 Home page — hero section

**Current:** Tailwind classes `py-20 px-6 text-center`. On mobile, `py-20` (80px top/bottom) is generous. Reduce:

```html
<!-- Replace: py-20 px-6 -->
<!-- With: py-10 px-4 md:py-20 md:px-6 -->
```

The `text-4xl font-bold` heading (`2.25rem`) is readable on mobile. No font-size change required.

The "Ver Programa" CTA button:
```html
<!-- Add min-height and padding for touch target -->
<!-- Replace: py-3 px-8 -->
<!-- With: py-3 px-8 min-h-[44px] -->
```

---

### 3.4 Programa page — filters

**Current:** `grid grid-cols-2 gap-4 p-6`. Two-column filter grid. On mobile, stack to 1 column.

```html
<!-- Replace: grid grid-cols-2 gap-4 -->
<!-- With: grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 -->
```

Padding:
```html
<!-- Replace: p-6 rounded-lg mb-8 -->
<!-- With: p-4 sm:p-6 rounded-lg mb-6 sm:mb-8 -->
```

---

### 3.5 Programa page — session cards

**Current:** Each session is a `<div class="bg-white p-6 rounded-lg ...">` with an inner `flex justify-between items-start` for title + track badge, and a `flex gap-4` for location/speaker metadata.

**Mobile (< 480px):** Title and track badge stack vertically (track below title). Location/speaker metadata stacks:

```html
<!-- Session card header row -->
<!-- Replace: flex justify-between items-start mb-2 -->
<!-- With: flex flex-col gap-1 mb-2 sm:flex-row sm:justify-between sm:items-start -->

<!-- Track badge: remove absolute positioning if any, it is inline-block already — no change -->

<!-- Meta row (sala + expositor) -->
<!-- Replace: flex gap-4 text-sm -->
<!-- With: flex flex-col gap-1 sm:flex-row sm:gap-4 text-sm -->
```

Session card outer padding:
```html
<!-- Replace: p-6 rounded-lg -->
<!-- With: p-4 sm:p-6 rounded-lg -->
```

---

### 3.6 Expositores page — card grid

**Current:** `display: grid; gridTemplateColumns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem`. The `auto-fill` with `280px` minimum will produce a single column on screens < 280px+padding, which covers mobile correctly. No layout change needed.

Reduce the outer page padding on mobile:

```css
/* globals.css */
.site-page-wrap {
  max-width: 960px;
  margin: 0 auto;
  padding: 2rem 1rem;
}
@media (min-width: 768px) {
  .site-page-wrap {
    padding: 3rem 1.5rem;
  }
}
```

**Template change required:** Replace the `<div style={{ maxWidth: '960px', margin: '0 auto', padding: '3rem 1.5rem' }}>` wrapper in `expositores/page.tsx` with `<div className="site-page-wrap">`.

The `h1` at `font-size: 2rem` on mobile is acceptable.

---

### 3.7 Expositor dashboard — header row

**Current:** Inline `display: flex; justify-content: space-between; align-items: center` for "Panel Expositor" + "Cerrar sesión" button. On narrow screens, the heading and button collide.

**Mobile (< 480px):** Stack vertically, button full-width below.

```css
/* globals.css */
.expositor-dash-header-inner {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}
@media (max-width: 479px) {
  .expositor-dash-header-inner {
    flex-direction: column;
    align-items: stretch;
  }
  .expositor-dash-header-inner button {
    width: 100%;
    min-height: 44px;
  }
}
```

---

### 3.8 Expositor dashboard — profile card

**Current:** `display: flex; gap: 2rem; align-items: flex-start` with a `150×150px` photo.

**Mobile (< 480px):** Stack photo above text. Reduce photo to `100px`.

```css
/* globals.css */
.expositor-profile {
  display: flex;
  gap: 2rem;
  align-items: flex-start;
}
.expositor-profile-photo {
  width: 150px;
  height: 150px;
  border-radius: .5rem;
  object-fit: cover;
  flex-shrink: 0;
}
@media (max-width: 479px) {
  .expositor-profile {
    flex-direction: column;
    gap: 1rem;
    align-items: center;
  }
  .expositor-profile-photo {
    width: 100px;
    height: 100px;
  }
}
```

---

### 3.9 Expositor dashboard — session cards

**Current:** `display: flex; gap: 2rem; justify-content: space-between` — session info on the left, QR on the right.

**Mobile (< 480px):** QR drops below the session info, centered.

```css
/* globals.css */
.expositor-sesion-inner {
  display: flex;
  gap: 2rem;
  justify-content: space-between;
}
.expositor-sesion-qr {
  text-align: center;
  flex-shrink: 0;
}
.expositor-sesion-qr img {
  width: 120px;
  height: 120px;
  border: 1px solid #ddd;
  border-radius: .5rem;
}
@media (max-width: 479px) {
  .expositor-sesion-inner {
    flex-direction: column;
    gap: 1rem;
  }
  .expositor-sesion-qr {
    align-self: center;
  }
}
```

---

## 4. Interaction and touch targets

| Element | Desktop size | Mobile minimum | How to achieve |
|---------|-------------|----------------|----------------|
| `.btn` (standard) | ~36px tall | 44px tall | `min-height: 44px` via `@media (max-width: 767px)` in `styles.scss` |
| `.btn-sm` | ~30px tall | 44px wide × 36px tall | `min-width: 44px; min-height: 36px` — sits in rows, horizontal tap area compensates |
| `.item-row` | full row clickable if routed | 44px tall minimum | `padding: .875rem 1rem` maintained |
| site nav links | text link | 44px tall | `min-height: 44px` on `.site-nav-link` and `.site-nav-link-badge` |
| `.cert-toggle` button (participantes) | inline toggle | 44px × 44px | add `min-width: 44px; min-height: 44px` in component style |
| Select filters (site programa) | native `<select>` | native handles touch natively | no change |

---

## 5. Edge cases

- **Aviso urgente with very long message:** The banner already wraps text. With `word-wrap: break-word` added in §3.2, a URL or non-breaking word won't overflow.
- **Conference name too long in site nav:** `.site-nav-brand-name` gets `max-width: 55vw; overflow: hidden; text-overflow: ellipsis; white-space: nowrap` on mobile, preventing overflow while keeping the nav links row visible.
- **Empty table on mobile:** `.empty-wrap` is block-level and already centered. `min-height: 380px` becomes `min-height: 200px` on mobile to avoid excessive whitespace:
  ```scss
  @media (max-width: 479px) {
    .empty-wrap { min-height: 200px; }
  }
  ```
- **Admin: congreso-form date fields:** Two date inputs in `.form-row` will stack to single column via §2.4. Dates render fully at `input[type=date]` native width — no issue.
- **Site: certificado page** — not inspected in detail but it uses a centered form card pattern. Ensure the card has `padding: 1.5rem 1rem` on mobile and the submit button is `width: 100%` with `min-height: 44px`. Flag for developer to verify.

---

## 6. Accessibility notes

- All interactive elements already have visible text (no icon-only buttons in the current codebase). The `.btn-label` hidden-on-mobile pattern (§2.1) only hides supplementary text alongside an icon; the icon character itself remains visible. This is acceptable but not ideal — flag to FA if screen reader support is a requirement, since emoji icons are not announced meaningfully.
- Minimum contrast: the existing palette passes WCAG AA at all sizes (dark navy backgrounds with `#f1f5f9` text: ~12:1 ratio; `--muted` `#94a3b8` on `--surface` `#1e293b`: ~4.8:1, passes AA for normal text).
- Focus rings are already defined (`box-shadow: 0 0 0 3px var(--primary-sub)` on `:focus`). On mobile, focus management is less critical but must not be removed.
- The `data-label` approach for table cards (§2.7b) uses CSS `content: attr(data-label)` — this is decorative and not announced by screen readers. If screen reader support for tables is required, use `<th scope="row">` pattern instead. Flag for FA.

---

## 7. Open questions for FA / PO

1. Is the "← Volver" button label critical to understand the action without text? If so, an icon-only button on mobile may need an `aria-label`. Confirm whether screen reader support is in scope.
2. The `certificado/page.tsx` was not reviewed in full — does it contain form elements that need the same responsive treatment as the other forms?
3. Should the expositor portal (`/expositor/login` and `/expositor/dashboard`) be fully optimized for mobile, or is it expected to be used primarily on desktop?

---

## 8. Flags for the Technical Lead

1. **Two SCSS class name inconsistencies in the codebase:** `participantes.component.ts` uses `.table-wrapper` and `.data-table`; the global `styles.scss` defines `.table-wrap`. Confirm which name is canonical before adding responsive rules — one of them may be unreachable.

2. **Tailwind breakpoint conflict:** The site uses Tailwind 4 (`@import "tailwindcss"`). The proposed `sm: 480px` breakpoint conflicts with Tailwind's default `sm: 640px`. Decide whether to (a) override `--breakpoint-sm` in `@theme`, (b) add a custom `xs` token, or (c) accept the 640px threshold for site-only responsive classes. This is an architectural decision that affects all Tailwind responsive prefixes.

3. **Inline styles in site components:** The responsive spec requires migrating inline `style` objects in `layout.tsx`, `expositor/dashboard/page.tsx`, and `expositores/page.tsx` to class-based rules in `globals.css`. This is a refactor step — it does not change behavior but changes how styles are applied. Ensure this is scoped in the implementation plan.

4. **`data-label` attributes on `<td>` elements:** These attributes need to be added in every component that renders a `.table-wrap` or `.table-wrapper` table. There are at least: `participantes`, `sesiones`, and potentially `admin-usuarios`. The TL should enumerate all table instances before implementation.

5. **`.cert-toggle` button in participantes:** This is a custom class defined inside the component's `styles` array, not in `styles.scss`. The 44px touch target rule must be added to that component's local styles, not the global file.

6. **Admin topbar: no hamburger menu required** under the current component inventory. If future screens add more than 2 actions to `.topbar-right`, a hamburger/drawer pattern will be needed. This is a design debt item to track.
