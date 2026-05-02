using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ConferenceManager.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddExpositor : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "expositores",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    ConferenciaId = table.Column<Guid>(type: "uuid", nullable: false),
                    Nombre = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    Bio = table.Column<string>(type: "text", nullable: true),
                    FotoUrl = table.Column<string>(type: "text", nullable: true),
                    Email = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    RedesSociales = table.Column<string>(type: "jsonb", nullable: true),
                    TokenAcceso = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamptz", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_expositores", x => x.Id);
                    table.ForeignKey(
                        name: "FK_expositores_conferencias_ConferenciaId",
                        column: x => x.ConferenciaId,
                        principalTable: "conferencias",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_expositores_ConferenciaId",
                table: "expositores",
                column: "ConferenciaId");

            migrationBuilder.CreateIndex(
                name: "IX_expositores_TokenAcceso",
                table: "expositores",
                column: "TokenAcceso",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "expositores");
        }
    }
}
