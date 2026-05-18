# Design Baseline — ConferenceManager

**Date:** 2026-05-16
**Author:** UX/UI Designer
**Style direction:** Derived from existing implementation in `admin/src/styles.scss` and `site/app/globals.css`. No new style direction decision was required — this document captures what is already live.

---

## Visual direction

Dark-first, minimal SaaS admin aesthetic. The admin panel uses a dark navy surface system (`#0f172a` / `#1e293b`) with a single blue accent (`#3b82f6`). Typography is Inter, tight weight scale. The public site uses a light neutral base (`#f8fafc` / `#fff`) with conference-branded primary colors injected at runtime via CSS custom properties. Both surfaces share the same spacing rhythm (8px grid) and the same border-radius scale. The overall feel is similar to a modern developer dashboard: no decorative elements, high contrast text, utility-first spacing.

---

## Color palette

### Admin panel (dark)
| Role | Value | Usage |
|------|-------|-------|
| background | `#0f172a` | `--bg`: page background |
| surface | `#1e293b` | `--surface`: cards, topbar, panels |
| surface-2 | `#263348` | `--surface2`: inputs, table headers, hover rows |
| border | `#334155` | `--border`: all borders at rest |
| border-focus | `#3b82f6` | `--border-focus`: focused inputs, hover cards |
| text | `#f1f5f9` | `--text`: primary text |
| muted | `#94a3b8` | `--muted`: subtitles, placeholders, labels |
| primary | `#3b82f6` | `--primary`: CTAs, links, accents |
| primary-hover | `#2563eb` | `--primary-h`: button hover |
| primary-subtle | `rgba(59,130,246,.12)` | `--primary-sub`: avatar bg, badges |
| danger | `#ef4444` | `--danger`: destructive actions, errors |
| danger-hover | `#dc2626` | `--danger-h` |
| danger-subtle | `rgba(239,68,68,.12)` | `--danger-sub`: error banners |
| success | `#22c55e` | `--success`: published state |
| success-subtle | `rgba(34,197,94,.12)` | `--success-sub` |
| warning | `#f59e0b` | `--warning`: draft state |
| warning-subtle | `rgba(245,158,11,.12)` | `--warning-sub` |

### Public site (light, runtime-branded)
| Role | Value | Usage |
|------|-------|-------|
| background | `#f8fafc` | page background |
| surface | `#ffffff` | cards, panels |
| border | `#e2e8f0` | card borders, dividers |
| text-primary | `#1a1a1a` / `#171717` | headings, body |
| text-muted | `#555` / `#666` / `#94a3b8` | subtitles, meta |
| brand-primary | runtime CSS var `--color-primary` | navbar, hero, CTAs |
| brand-secondary | runtime CSS var `--color-secondary` | accent elements |
| aviso-urgente | `#dc2626` | urgent notice banner |

---

## Typography

### Admin panel
| Element | Font | Size | Weight |
|---------|------|------|--------|
| Base body | Inter, system-ui, sans-serif | 16px / 1rem | 400 |
| h1 | Inter | 1.75rem (28px) | 700 |
| h2 | Inter | 1.375rem (22px) | 700 |
| h3 | Inter | 1.125rem (18px) | 600 |
| Label / meta | Inter | 0.875rem (14px) | 500 |
| Small / hint | Inter | 0.8rem (12.8px) | 400 |
| Button | Inter | 0.875rem (14px) | 500 |
| Table header | Inter | 0.75rem (12px) | 600 — uppercase, letter-spacing 0.06em |
| Badge | Inter | 0.75rem (12px) | 600 — uppercase |

### Public site
| Element | Font | Size | Weight |
|---------|------|------|--------|
| Base body | Arial, Helvetica, sans-serif | 16px | 400 |
| Hero h1 | inherited | 2.25rem (36px) | 700 |
| Section h2 | inherited | 1.875rem (30px) | 700 |
| Session title h3 | inherited | 1.25rem (20px) | 700 |
| Body / meta | inherited | 0.875–0.9375rem | 400–500 |

---

## Spacing scale

Base unit: **8px**. Scale: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64.

Key layout values:
- Topbar height (admin): 64px
- Topbar height (site): 60px
- Page body max-width (admin): 1200px, padding 2rem (32px) each side
- Page body max-width (site): 960–1200px, padding 1.5rem (24px) each side
- Card padding: 1.5rem (24px)
- Form panel padding: 1.5rem (24px)
- Section gap (`.item-list`): 0.75rem (12px)

---

## Border-radius scale
| Token | Value | Usage |
|-------|-------|-------|
| `--r-sm` | 6px | buttons, inputs, small elements |
| `--r-md` | 10px | cards, panels, tables |
| `--r-lg` | 16px | auth card |

---

## Shadows
| Token | Value | Usage |
|-------|-------|-------|
| `--sh-sm` | `0 1px 3px rgba(0,0,0,.4)` | cards at rest |
| `--sh-md` | `0 4px 16px rgba(0,0,0,.5)` | panels, modals, hover cards |

---

## Global rules

- **Box model:** `box-sizing: border-box` globally.
- **Transitions:** `150ms ease` (`--t`) on color, border, background.
- **Focus style:** `border-color: var(--border-focus)` + `box-shadow: 0 0 0 3px var(--primary-sub)`. No outline:none without a visible replacement.
- **Disabled state:** `opacity: 0.5`, `cursor: not-allowed`, `pointer-events: none`.
- **Button anatomy:** `inline-flex`, `align-items: center`, `gap: 6px`, `white-space: nowrap`.
- **No angular NgModules** — all admin components are standalone.
- **Public site nav** uses runtime brand colors — never hardcode them in site components.
