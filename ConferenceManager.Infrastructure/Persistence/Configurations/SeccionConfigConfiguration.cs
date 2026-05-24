using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ConferenceManager.Models;

namespace ConferenceManager.Data.Configurations;

public class SeccionConfigConfiguration : IEntityTypeConfiguration<SeccionConfig>
{
    public void Configure(EntityTypeBuilder<SeccionConfig> builder)
    {
        builder.ToTable("seccion_configs");
        builder.HasKey(s => s.Id);
        builder.Property(s => s.Id).HasDefaultValueSql("gen_random_uuid()");
        builder.HasIndex(s => new { s.ConferenciaId, s.SeccionKey }).IsUnique();
        builder.HasOne(s => s.Conferencia)
               .WithMany(c => c.SeccionConfigs)
               .HasForeignKey(s => s.ConferenciaId)
               .OnDelete(DeleteBehavior.Cascade);
    }
}
