using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using ConferenceManager.Data;

#nullable disable

namespace ConferenceManager.Data.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20260516000000_AlterQrCodeUrlToText")]
    partial class AlterQrCodeUrlToText
    {
        protected override void BuildTargetModel(ModelBuilder modelBuilder) { }
    }
}
