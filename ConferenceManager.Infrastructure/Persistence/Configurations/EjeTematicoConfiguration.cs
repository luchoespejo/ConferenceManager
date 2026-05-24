using ConferenceManager.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ConferenceManager.Data.Configurations;

public class EjeTematicoConfiguration : IEntityTypeConfiguration<EjeTematico>
{
    public void Configure(EntityTypeBuilder<EjeTematico> builder)
    {
        builder.ToTable("ejes_tematicos");

        builder.HasKey(e => e.Id);
        builder.Property(e => e.Id)
            .HasDefaultValueSql("gen_random_uuid()");

        builder.Property(e => e.Nombre)
            .IsRequired()
            .HasColumnType("text");

        builder.HasOne(e => e.Conferencia)
            .WithMany(c => c.EjesTematicos)
            .HasForeignKey(e => e.ConferenciaId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(e => e.ConferenciaId);
    }
}
