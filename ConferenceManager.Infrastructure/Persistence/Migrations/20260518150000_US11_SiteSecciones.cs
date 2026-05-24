using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ConferenceManager.Data.Migrations
{
    public partial class US11_SiteSecciones : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // New text fields on conferencias
            migrationBuilder.AddColumn<string>(
                name: "Lema",
                table: "conferencias",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EmailContacto",
                table: "conferencias",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Instagram",
                table: "conferencias",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FormularioInscripcionUrl",
                table: "conferencias",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ArancelesTexto",
                table: "conferencias",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "InformacionPago",
                table: "conferencias",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ContactoAdicional",
                table: "conferencias",
                type: "text",
                nullable: true);

            // Section visibility toggles
            migrationBuilder.AddColumn<bool>(
                name: "MostrarFechas",
                table: "conferencias",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<bool>(
                name: "MostrarDescripcion",
                table: "conferencias",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<bool>(
                name: "MostrarOrganizadores",
                table: "conferencias",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "MostrarContacto",
                table: "conferencias",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<bool>(
                name: "MostrarInscripciones",
                table: "conferencias",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            // New table: organizadores
            migrationBuilder.CreateTable(
                name: "organizadores",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    ConferenciaId = table.Column<Guid>(type: "uuid", nullable: false),
                    Nombre = table.Column<string>(type: "text", nullable: false),
                    LogoUrl = table.Column<string>(type: "text", nullable: true),
                    Orden = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_organizadores", x => x.Id);
                    table.ForeignKey(
                        name: "FK_organizadores_conferencias_ConferenciaId",
                        column: x => x.ConferenciaId,
                        principalTable: "conferencias",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_organizadores_ConferenciaId",
                table: "organizadores",
                column: "ConferenciaId");

            // New table: fechas_importantes
            migrationBuilder.CreateTable(
                name: "fechas_importantes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    ConferenciaId = table.Column<Guid>(type: "uuid", nullable: false),
                    Descripcion = table.Column<string>(type: "text", nullable: false),
                    Fecha = table.Column<DateOnly>(type: "date", nullable: false),
                    FechaFin = table.Column<DateOnly>(type: "date", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_fechas_importantes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_fechas_importantes_conferencias_ConferenciaId",
                        column: x => x.ConferenciaId,
                        principalTable: "conferencias",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_fechas_importantes_ConferenciaId",
                table: "fechas_importantes",
                column: "ConferenciaId");

            // New table: ejes_tematicos
            migrationBuilder.CreateTable(
                name: "ejes_tematicos",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    ConferenciaId = table.Column<Guid>(type: "uuid", nullable: false),
                    Nombre = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ejes_tematicos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ejes_tematicos_conferencias_ConferenciaId",
                        column: x => x.ConferenciaId,
                        principalTable: "conferencias",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ejes_tematicos_ConferenciaId",
                table: "ejes_tematicos",
                column: "ConferenciaId");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "organizadores");
            migrationBuilder.DropTable(name: "fechas_importantes");
            migrationBuilder.DropTable(name: "ejes_tematicos");

            migrationBuilder.DropColumn(name: "Lema", table: "conferencias");
            migrationBuilder.DropColumn(name: "EmailContacto", table: "conferencias");
            migrationBuilder.DropColumn(name: "Instagram", table: "conferencias");
            migrationBuilder.DropColumn(name: "FormularioInscripcionUrl", table: "conferencias");
            migrationBuilder.DropColumn(name: "ArancelesTexto", table: "conferencias");
            migrationBuilder.DropColumn(name: "InformacionPago", table: "conferencias");
            migrationBuilder.DropColumn(name: "ContactoAdicional", table: "conferencias");
            migrationBuilder.DropColumn(name: "MostrarFechas", table: "conferencias");
            migrationBuilder.DropColumn(name: "MostrarDescripcion", table: "conferencias");
            migrationBuilder.DropColumn(name: "MostrarOrganizadores", table: "conferencias");
            migrationBuilder.DropColumn(name: "MostrarContacto", table: "conferencias");
            migrationBuilder.DropColumn(name: "MostrarInscripciones", table: "conferencias");
        }
    }
}
