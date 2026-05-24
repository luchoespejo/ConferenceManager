using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using ConferenceManager.Data;

#nullable disable

namespace ConferenceManager.Data.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20260518160000_AddBannerModo")]
    partial class AddBannerModo
    {
        protected override void BuildTargetModel(ModelBuilder modelBuilder) { }
    }
}
