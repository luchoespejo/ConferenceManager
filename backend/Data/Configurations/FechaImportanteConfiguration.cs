using ConferenceManager.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ConferenceManager.Data.Configurations;

public class FechaImportanteConfiguration : IEntityTypeConfiguration<FechaImportante>
{
    public void Configure(EntityTypeBuilder<FechaImportante> builder)
    {
        builder.ToTable("fechas_importantes");

        builder.HasKey(f => f.Id);
        builder.Property(f => f.Id)
            .HasDefaultValueSql("gen_random_uuid()");

        builder.Property(f => f.Descripcion)
            .IsRequired()
            .HasColumnType("text");

        builder.Property(f => f.Fecha)
            .HasColumnType("date")
            .IsRequired();

        builder.Property(f => f.FechaFin)
            .HasColumnType("date");

        builder.HasOne(f => f.Conferencia)
            .WithMany(c => c.FechasImportantes)
            .HasForeignKey(f => f.ConferenciaId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(f => f.ConferenciaId);
    }
}
