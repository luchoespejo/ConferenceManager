using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ConferenceManager.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddInformacionAdicional : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "InformacionAdicional",
                table: "conferencias",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "MostrarInformacion",
                table: "conferencias",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "InformacionAdicional",
                table: "conferencias");

            migrationBuilder.DropColumn(
                name: "MostrarInformacion",
                table: "conferencias");
        }
    }
}
