using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ConferenceManager.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddSeccionConfigExtras : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "FontSize",
                table: "seccion_configs",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "LogoAltura",
                table: "seccion_configs",
                type: "integer",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FontSize",
                table: "seccion_configs");

            migrationBuilder.DropColumn(
                name: "LogoAltura",
                table: "seccion_configs");
        }
    }
}
