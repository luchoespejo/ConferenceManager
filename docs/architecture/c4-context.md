# C4 Level 1 — System Context Diagram: ConferenceManager

```mermaid
flowchart TB
    subgraph SG_Actors["Actors"]
        N_Organizer["**Organizer**<br>[Person]<br><br>Creates and manages<br>congress: sessions,<br>speakers, branding,<br>materials"]
        N_Speaker["**Speaker / Exhibitor**<br>[Person]<br><br>Accesses speaker portal<br>via magic token URL.<br>Views logistics, uploads<br>presentation materials"]
        N_Participant["**Participant**<br>[Person]<br><br>Attends congress,<br>scans QR codes, views<br>schedule, downloads<br>certificate PDF"]
    end

    subgraph SG_System["ConferenceManager Platform [Software System]"]
        N_System["**ConferenceManager**<br>[Software System]<br><br>Multi-tenant SaaS for<br>congress management.<br>Serves all congresses<br>via dynamic subdomains<br>({slug}.tuplataforma.com)"]
    end

    subgraph SG_External["External Systems"]
        N_R2["**Cloudflare R2**<br>[External System]<br><br>Object storage for<br>uploaded files,<br>speaker materials,<br>and generated PDFs"]
        N_Resend["**Resend**<br>[External System]<br><br>Transactional email<br>delivery service.<br>Sends magic tokens<br>and notifications"]
        N_GoogleCal["**Google Calendar / iCal**<br>[External System]<br><br>Calendar integration.<br>Participants add sessions<br>to their personal<br>calendar"]
        N_SurveyTools["**External Survey Tools**<br>[External System]<br><br>Google Forms, Typeform,<br>or any URL-based survey.<br>Organizer pastes URL<br>per session"]
        N_Vercel["**Vercel / Wildcard DNS**<br>[External System]<br><br>Hosting for Next.js<br>mini-site. Wildcard DNS<br>*.tuplataforma.com routes<br>all subdomains"]
    end

    N_Organizer -->|"Manages congress via<br>Angular Admin Panel<br>[HTTPS / JWT]"| N_System
    N_Speaker -.->|"Accesses speaker portal<br>via magic token URL<br>[HTTPS / no login]"| N_System
    N_Participant -->|"Views schedule, scans QR,<br>downloads certificate<br>[HTTPS / public]"| N_System

    N_System -->|"Stores and retrieves<br>files and PDFs<br>[S3-compatible API]"| N_R2
    N_System -.->|"Sends transactional<br>emails asynchronously<br>[REST API]"| N_Resend
    N_System -.->|"Exports .ics feed<br>for calendar add<br>[iCal format]"| N_GoogleCal
    N_Participant -.->|"Follows external<br>survey link<br>[redirect]"| N_SurveyTools
    N_System -->|"Mini-site deployed on<br>wildcard subdomain<br>[Next.js / ISR]"| N_Vercel

classDef person    fill:#1168bd,stroke:#0b4884,color:#fff
classDef system    fill:#1168bd,stroke:#0b4884,color:#fff
classDef external  fill:#999,stroke:#666,color:#fff

class N_Organizer,N_Speaker,N_Participant person
class N_System system
class N_R2,N_Resend,N_GoogleCal,N_SurveyTools,N_Vercel external
```

## Narrative

ConferenceManager is a multi-tenant SaaS platform that allows **Organizers** to create and fully manage academic or professional congresses through a dedicated Angular-based admin panel (JWT-authenticated). Each congress is served under a dynamic subdomain (`{slug}.tuplataforma.com`) powered by a single Next.js deployment on Vercel.

**Speakers** receive a magic-token URL via email — no account or password required — granting them access to their personalized portal where they upload presentation materials and view their logistics.

**Participants** interact with the public-facing mini-site: browsing the schedule, scanning QR codes at venue gates, adding sessions to their calendar, and downloading attendance certificates (PDF generated on-demand server-side).

File storage is delegated to **Cloudflare R2** (S3-compatible). Email delivery uses **Resend**. External surveys (Google Forms, Typeform, etc.) are linked per session — the platform does not host forms.

---
*Date: 2026-04-26 | Author: Architect (ARCH)*
