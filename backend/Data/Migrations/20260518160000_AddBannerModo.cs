using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ConferenceManager.Data.Migrations
{
    public partial class AddBannerModo : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // US11 columns were applied directly to DB but its Designer.cs was missing so EF
            // never recorded it in history. Mark it applied now to keep history consistent.
            migrationBuilder.Sql(@"
                INSERT INTO ""__EFMigrationsHistory"" (""MigrationId"", ""ProductVersion"")
                SELECT '20260518150000_US11_SiteSecciones', '10.0.7'
                WHERE NOT EXISTS (
                    SELECT 1 FROM ""__EFMigrationsHistory""
                    WHERE ""MigrationId"" = '20260518150000_US11_SiteSecciones'
                );
            ");

            migrationBuilder.AddColumn<string>(
                name: "BannerModo",
                table: "conferencias",
                type: "text",
                nullable: false,
                defaultValue: "fondo");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BannerModo",
                table: "conferencias");
        }
    }
}
