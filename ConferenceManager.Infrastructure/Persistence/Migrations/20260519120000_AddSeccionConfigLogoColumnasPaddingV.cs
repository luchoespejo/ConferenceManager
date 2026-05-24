using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ConferenceManager.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddSeccionConfigLogoColumnasPaddingV : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "LogoColumnas",
                table: "seccion_configs",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "PaddingV",
                table: "seccion_configs",
                type: "integer",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "LogoColumnas",
                table: "seccion_configs");

            migrationBuilder.DropColumn(
                name: "PaddingV",
                table: "seccion_configs");
        }
    }
}
