# C4 Level 2 — Container Diagram: ConferenceManager

```mermaid
flowchart TB
    subgraph SG_Actors["Actors"]
        N_Organizer["**Organizer**<br>[Person]<br><br>Manages congress via<br>Angular Admin Panel"]
        N_Speaker["**Speaker**<br>[Person]<br><br>Accesses portal via<br>magic token URL"]
        N_Participant["**Participant**<br>[Person]<br><br>Views schedule, QR,<br>certificate download"]
    end

    subgraph SG_Platform["ConferenceManager Platform [Software System]"]

        subgraph SG_Frontend["Frontend Layer"]
            N_AdminPanel["**Angular Admin Panel**<br>[Container: SPA / Angular 17+]<br><br>Standalone components,<br>Signals, OnPush CD.<br>JWT auth. Hosted on Vercel<br>or static CDN"]
            N_NextSite["**Next.js Mini-Site**<br>[Container: Web App / Next.js 14]<br><br>Single deploy for all congresses.<br>Middleware extracts slug from host.<br>ISR/SSR/CSR per route.<br>Hosted on Vercel<br>*.tuplataforma.com"]
        end

        subgraph SG_Backend["Backend Layer"]
            N_API["**ConferenceManager API**<br>[Container: .NET Core 8 Web API]<br><br>REST API. Business logic,<br>multi-tenancy, auth (JWT +<br>magic tokens), QR generation,<br>PDF generation. Hosted on Railway"]
        end

        subgraph SG_Data["Data Layer"]
            N_DB["**PostgreSQL**<br>[Container: Database]<br><br>Primary relational store.<br>All congress, session,<br>speaker, participant data.<br>Managed by Railway"]
        end
    end

    subgraph SG_External["External Systems"]
        N_R2["**Cloudflare R2**<br>[External: Object Storage]<br><br>Files, speaker materials,<br>generated PDFs"]
        N_Resend["**Resend**<br>[External: Email Service]<br><br>Transactional emails,<br>magic token delivery"]
        N_GoogleCal["**Google Calendar / iCal**<br>[External: Calendar]<br><br>Session calendar export"]
        N_SurveyURL["**External Survey Tool**<br>[External: Survey]<br><br>Google Forms, Typeform,<br>etc. — URL only"]
        N_VercelDNS["**Vercel Wildcard DNS**<br>[External: DNS / CDN]<br><br>*.tuplataforma.com<br>routes to Next.js deploy"]
    end

    %% Organizer flows
    N_Organizer -->|"HTTPS / JWT<br>Manages congress"| N_AdminPanel
    N_AdminPanel -->|"REST / HTTPS<br>Bearer JWT"| N_API

    %% Speaker flows
    N_Speaker -.->|"HTTPS / magic token URL<br>No login"| N_NextSite

    %% Participant flows
    N_Participant -->|"HTTPS / public<br>Views mini-site"| N_NextSite
    N_Participant -.->|"Redirect to external URL"| N_SurveyURL

    %% Next.js to API
    N_NextSite -->|"REST / HTTPS<br>SSR data fetch<br>(session-scoped)"| N_API
    N_NextSite -.->|"POST /api/revalidate<br>ISR cache invalidation<br>(from API webhook)"| N_NextSite

    %% API to DB
    N_API -->|"EF Core 8 + Dapper<br>SQL / TCP"| N_DB

    %% API to external services
    N_API -->|"S3-compatible SDK<br>Upload / download files"| N_R2
    N_API -.->|"REST API<br>Send emails async"| N_Resend
    N_API -.->|"Generate .ics feed<br>Calendar export"| N_GoogleCal

    %% Next.js / Vercel
    N_NextSite -->|"Deployed on"| N_VercelDNS
    N_NextSite -->|"GET file URLs<br>Public CDN links"| N_R2

    %% ISR revalidation webhook (API -> Next.js)
    N_API -.->|"POST /api/revalidate<br>On data change<br>(async webhook)"| N_NextSite

classDef person    fill:#1168bd,stroke:#0b4884,color:#fff
classDef container fill:#438dd5,stroke:#306da3,color:#fff
classDef data      fill:#f90,stroke:#c60,color:#fff
classDef external  fill:#999,stroke:#666,color:#fff

class N_Organizer,N_Speaker,N_Participant person
class N_AdminPanel,N_NextSite,N_API container
class N_DB data
class N_R2,N_Resend,N_GoogleCal,N_SurveyURL,N_VercelDNS external
```

## Container Descriptions

| Container | Technology | Responsibility |
|---|---|---|
| **Angular Admin Panel** | Angular 17+, standalone components, Signals, OnPush | Full CRUD for organizer: congress, sessions, speakers, participants, branding. JWT-authenticated. |
| **Next.js Mini-Site** | Next.js 14 App Router, single Vercel deploy | Public-facing congress site. Middleware extracts `slug` from hostname, routes are ISR/SSR/CSR based on data volatility. |
| **ConferenceManager API** | .NET Core 8 Web API, Railway | Core business logic: multi-tenancy, auth, QR/PDF generation, file orchestration, ISR webhooks. |
| **PostgreSQL** | PostgreSQL 16, Railway managed | Authoritative relational store for all domain data. Accessed via EF Core 8 (migrations, LINQ) and Dapper (complex read queries). |

## Key Flows

1. **Congress management** — Organizer uses Angular Admin Panel; all mutations go through the API with JWT auth; API writes to PostgreSQL; API fires `POST /api/revalidate` to Next.js to invalidate ISR cache.
2. **Speaker portal** — Speaker follows magic-token URL on Next.js mini-site; Next.js calls API to validate token; speaker uploads materials via API, which stores them in Cloudflare R2.
3. **Participant certificate** — Participant submits email on mini-site; Next.js calls API; API verifies registration, generates PDF with PdfSharp, streams/stores via R2, returns download URL.
4. **Subdomain routing** — Vercel wildcard DNS `*.tuplataforma.com` routes all subdomains to the single Next.js deploy; Next.js middleware reads `x-forwarded-host` / `host`, extracts slug, injects `x-congress-slug` header for downstream Server Components and API calls.

---
*Date: 2026-04-26 | Author: Architect (ARCH)*
