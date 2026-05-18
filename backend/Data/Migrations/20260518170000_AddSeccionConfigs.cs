using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ConferenceManager.Data.Migrations
{
    public partial class AddSeccionConfigs : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "seccion_configs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    ConferenciaId = table.Column<Guid>(type: "uuid", nullable: false),
                    SeccionKey = table.Column<string>(type: "varchar(50)", nullable: false),
                    BgColor = table.Column<string>(type: "varchar(20)", nullable: true),
                    TextoColor = table.Column<string>(type: "varchar(20)", nullable: true),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_seccion_configs", x => x.Id);
                    table.ForeignKey("FK_seccion_configs_conferencias",
                        x => x.ConferenciaId,
                        principalTable: "conferencias",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_seccion_configs_ConferenciaId_SeccionKey",
                table: "seccion_configs",
                columns: new[] { "ConferenciaId", "SeccionKey" },
                unique: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "seccion_configs");
        }
    }
}
