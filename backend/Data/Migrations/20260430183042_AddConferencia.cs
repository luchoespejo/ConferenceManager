using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ConferenceManager.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddConferencia : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "conferencias",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    UsuarioId = table.Column<Guid>(type: "uuid", nullable: false),
                    Nombre = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    Slug = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Descripcion = table.Column<string>(type: "text", nullable: true),
                    FechaInicio = table.Column<DateOnly>(type: "date", nullable: false),
                    FechaFin = table.Column<DateOnly>(type: "date", nullable: false),
                    Estado = table.Column<string>(type: "text", nullable: false, defaultValue: "Borrador"),
                    LogoUrl = table.Column<string>(type: "text", nullable: true),
                    LogoSecundarioUrl = table.Column<string>(type: "text", nullable: true),
                    BannerUrl = table.Column<string>(type: "text", nullable: true),
                    FaviconUrl = table.Column<string>(type: "text", nullable: true),
                    ColorPrimario = table.Column<string>(type: "character varying(7)", maxLength: 7, nullable: true),
                    ColorSecundario = table.Column<string>(type: "character varying(7)", maxLength: 7, nullable: true),
                    Tipografia = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    VenueNombre = table.Column<string>(type: "text", nullable: true),
                    VenueDireccion = table.Column<string>(type: "text", nullable: true),
                    VenueLinkMaps = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamptz", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_conferencias", x => x.Id);
                    table.ForeignKey(
                        name: "FK_conferencias_usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_conferencias_Slug",
                table: "conferencias",
                column: "Slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_conferencias_UsuarioId_Estado",
                table: "conferencias",
                columns: new[] { "UsuarioId", "Estado" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "conferencias");
        }
    }
}
