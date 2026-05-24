-- =============================================================================
-- ConferenceManager — Bootstrap SQL
-- Creates all tables from scratch (idempotent) and inserts the demo admin user.
-- Intended for a fresh/empty PostgreSQL instance (e.g. Docker dev container).
-- =============================================================================

-- Required extension (uuid generation via gen_random_uuid())
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- -----------------------------------------------------------------------------
-- usuarios
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
    "Id"                        uuid        NOT NULL DEFAULT gen_random_uuid(),
    "Email"                     varchar(254) NOT NULL,
    "PasswordHash"              text        NOT NULL,
    "Nombre"                    varchar(200) NOT NULL,
    "Organizacion"              varchar(200) NOT NULL,
    "EmailVerificado"           boolean     NOT NULL DEFAULT false,
    "VerificationToken"         varchar(32)          ,
    "VerificationTokenExpiresAt" timestamptz          ,
    "CreatedAt"                 timestamptz NOT NULL DEFAULT NOW(),
    CONSTRAINT "PK_usuarios" PRIMARY KEY ("Id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "IX_usuarios_Email"
    ON usuarios ("Email");

CREATE INDEX IF NOT EXISTS "IX_usuarios_VerificationToken"
    ON usuarios ("VerificationToken");

-- -----------------------------------------------------------------------------
-- refresh_tokens
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS refresh_tokens (
    "Id"         uuid        NOT NULL DEFAULT gen_random_uuid(),
    "UsuarioId"  uuid        NOT NULL,
    "TokenHash"  varchar(64) NOT NULL,
    "ExpiresAt"  timestamptz NOT NULL,
    "Revoked"    boolean     NOT NULL DEFAULT false,
    "CreatedAt"  timestamptz NOT NULL DEFAULT NOW(),
    CONSTRAINT "PK_refresh_tokens" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_refresh_tokens_usuarios_UsuarioId"
        FOREIGN KEY ("UsuarioId") REFERENCES usuarios ("Id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "IX_refresh_tokens_TokenHash"
    ON refresh_tokens ("TokenHash");

CREATE INDEX IF NOT EXISTS "IX_refresh_tokens_UsuarioId_Revoked"
    ON refresh_tokens ("UsuarioId", "Revoked");

-- -----------------------------------------------------------------------------
-- conferencias
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS conferencias (
    "Id"               uuid           NOT NULL DEFAULT gen_random_uuid(),
    "UsuarioId"        uuid           NOT NULL,
    "Nombre"           varchar(255)   NOT NULL,
    "Slug"             varchar(50)    NOT NULL,
    "Descripcion"      text                    ,
    "FechaInicio"      date           NOT NULL,
    "FechaFin"         date           NOT NULL,
    "Estado"           text           NOT NULL DEFAULT 'Borrador',
    "LogoUrl"          text                    ,
    "LogoSecundarioUrl" text                   ,
    "BannerUrl"        text                    ,
    "FaviconUrl"       text                    ,
    "ColorPrimario"    varchar(7)              ,
    "ColorSecundario"  varchar(7)              ,
    "Tipografia"       varchar(100)            ,
    "VenueNombre"      text                    ,
    "VenueDireccion"   text                    ,
    "VenueLinkMaps"    text                    ,
    "CreatedAt"        timestamptz    NOT NULL DEFAULT NOW(),
    CONSTRAINT "PK_conferencias" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_conferencias_usuarios_UsuarioId"
        FOREIGN KEY ("UsuarioId") REFERENCES usuarios ("Id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "IX_conferencias_Slug"
    ON conferencias ("Slug");

CREATE INDEX IF NOT EXISTS "IX_conferencias_UsuarioId_Estado"
    ON conferencias ("UsuarioId", "Estado");

-- -----------------------------------------------------------------------------
-- salas
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS salas (
    "Id"            uuid         NOT NULL DEFAULT gen_random_uuid(),
    "ConferenciaId" uuid         NOT NULL,
    "Nombre"        varchar(100) NOT NULL,
    "Capacidad"     integer               ,
    "CreatedAt"     timestamptz  NOT NULL DEFAULT NOW(),
    CONSTRAINT "PK_salas" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_salas_conferencias_ConferenciaId"
        FOREIGN KEY ("ConferenciaId") REFERENCES conferencias ("Id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "IX_salas_ConferenciaId_Nombre"
    ON salas ("ConferenciaId", "Nombre");

-- -----------------------------------------------------------------------------
-- expositores
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS expositores (
    "Id"             uuid         NOT NULL DEFAULT gen_random_uuid(),
    "ConferenciaId"  uuid         NOT NULL,
    "Nombre"         varchar(255) NOT NULL,
    "Email"          varchar(255)          ,
    "Bio"            text                  ,
    "FotoUrl"        text                  ,
    "RedesSociales"  jsonb                 ,
    "TokenAcceso"    varchar(36)  NOT NULL,
    "CreatedAt"      timestamptz  NOT NULL DEFAULT NOW(),
    CONSTRAINT "PK_expositores" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_expositores_conferencias_ConferenciaId"
        FOREIGN KEY ("ConferenciaId") REFERENCES conferencias ("Id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "IX_expositores_TokenAcceso"
    ON expositores ("TokenAcceso");

CREATE INDEX IF NOT EXISTS "IX_expositores_ConferenciaId"
    ON expositores ("ConferenciaId");

-- -----------------------------------------------------------------------------
-- sesiones
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sesiones (
    "Id"            uuid         NOT NULL DEFAULT gen_random_uuid(),
    "ConferenciaId" uuid         NOT NULL,
    "SalaId"        uuid         NOT NULL,
    "ExpositorId"   uuid         NOT NULL,
    "Titulo"        varchar(255) NOT NULL,
    "Descripcion"   text                  ,
    "Fecha"         date         NOT NULL,
    "HoraInicio"    time         NOT NULL,
    "HoraFin"       time         NOT NULL,
    "Track"         varchar(100)          ,
    "EncuestaUrl"   varchar(500)          ,
    "QrCodeUrl"     varchar(500)          ,
    "CreatedAt"     timestamptz  NOT NULL DEFAULT NOW(),
    CONSTRAINT "PK_sesiones" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_sesiones_conferencias_ConferenciaId"
        FOREIGN KEY ("ConferenciaId") REFERENCES conferencias ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_sesiones_salas_SalaId"
        FOREIGN KEY ("SalaId") REFERENCES salas ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_sesiones_expositores_ExpositorId"
        FOREIGN KEY ("ExpositorId") REFERENCES expositores ("Id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "IX_sesiones_ConferenciaId"
    ON sesiones ("ConferenciaId");

CREATE INDEX IF NOT EXISTS "IX_sesiones_SalaId"
    ON sesiones ("SalaId");

CREATE INDEX IF NOT EXISTS "IX_sesiones_ExpositorId"
    ON sesiones ("ExpositorId");

CREATE INDEX IF NOT EXISTS "IX_sesiones_Fecha"
    ON sesiones ("Fecha");

-- =============================================================================
-- Seed: demo admin user
-- Email    : admin@demo.com
-- Password : Admin@1234  (bcrypt cost=11)
-- =============================================================================
INSERT INTO usuarios (
    "Email",
    "PasswordHash",
    "Nombre",
    "Organizacion",
    "EmailVerificado"
)
SELECT
    'admin@demo.com',
    '$2a$11$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'Admin Demo',
    'Demo',
    true
WHERE NOT EXISTS (
    SELECT 1 FROM usuarios WHERE "Email" = 'admin@demo.com'
);
