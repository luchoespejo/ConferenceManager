using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ConferenceManager.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddProgramaSection : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "MostrarPrograma",
                table: "conferencias",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "ProgramaAdicional",
                table: "conferencias",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ProgramaUrl",
                table: "conferencias",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "MostrarPrograma",
                table: "conferencias");

            migrationBuilder.DropColumn(
                name: "ProgramaAdicional",
                table: "conferencias");

            migrationBuilder.DropColumn(
                name: "ProgramaUrl",
                table: "conferencias");
        }
    }
}
