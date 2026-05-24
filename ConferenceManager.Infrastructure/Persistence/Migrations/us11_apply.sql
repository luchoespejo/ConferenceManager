ALTER TABLE conferencias ADD COLUMN IF NOT EXISTS "Lema" text;
ALTER TABLE conferencias ADD COLUMN IF NOT EXISTS "EmailContacto" text;
ALTER TABLE conferencias ADD COLUMN IF NOT EXISTS "Instagram" text;
ALTER TABLE conferencias ADD COLUMN IF NOT EXISTS "FormularioInscripcionUrl" text;
ALTER TABLE conferencias ADD COLUMN IF NOT EXISTS "ArancelesTexto" text;
ALTER TABLE conferencias ADD COLUMN IF NOT EXISTS "InformacionPago" text;
ALTER TABLE conferencias ADD COLUMN IF NOT EXISTS "ContactoAdicional" text;
ALTER TABLE conferencias ADD COLUMN IF NOT EXISTS "MostrarFechas" boolean NOT NULL DEFAULT true;
ALTER TABLE conferencias ADD COLUMN IF NOT EXISTS "MostrarDescripcion" boolean NOT NULL DEFAULT true;
ALTER TABLE conferencias ADD COLUMN IF NOT EXISTS "MostrarOrganizadores" boolean NOT NULL DEFAULT false;
ALTER TABLE conferencias ADD COLUMN IF NOT EXISTS "MostrarContacto" boolean NOT NULL DEFAULT true;
ALTER TABLE conferencias ADD COLUMN IF NOT EXISTS "MostrarInscripciones" boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS organizadores (
    "Id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "ConferenciaId" uuid NOT NULL,
    "Nombre" text NOT NULL,
    "LogoUrl" text,
    "Orden" integer NOT NULL,
    CONSTRAINT "PK_organizadores" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_organizadores_conferencias_ConferenciaId" FOREIGN KEY ("ConferenciaId") REFERENCES conferencias("Id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "IX_organizadores_ConferenciaId" ON organizadores("ConferenciaId");

CREATE TABLE IF NOT EXISTS fechas_importantes (
    "Id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "ConferenciaId" uuid NOT NULL,
    "Descripcion" text NOT NULL,
    "Fecha" date NOT NULL,
    "FechaFin" date,
    CONSTRAINT "PK_fechas_importantes" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_fechas_importantes_conferencias_ConferenciaId" FOREIGN KEY ("ConferenciaId") REFERENCES conferencias("Id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "IX_fechas_importantes_ConferenciaId" ON fechas_importantes("ConferenciaId");

CREATE TABLE IF NOT EXISTS ejes_tematicos (
    "Id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "ConferenciaId" uuid NOT NULL,
    "Nombre" text NOT NULL,
    CONSTRAINT "PK_ejes_tematicos" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_ejes_tematicos_conferencias_ConferenciaId" FOREIGN KEY ("ConferenciaId") REFERENCES conferencias("Id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "IX_ejes_tematicos_ConferenciaId" ON ejes_tematicos("ConferenciaId");

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260518150000_US11_SiteSecciones', '9.0.0')
ON CONFLICT DO NOTHING;
