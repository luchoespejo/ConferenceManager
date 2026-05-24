using ConferenceManager.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ConferenceManager.Data.Configurations;

public class ParticipanteConfiguration : IEntityTypeConfiguration<Participante>
{
    public void Configure(EntityTypeBuilder<Participante> builder)
    {
        builder.ToTable("participantes");

        builder.HasKey(p => p.Id);
        builder.Property(p => p.Id)
            .HasDefaultValueSql("gen_random_uuid()");

        builder.Property(p => p.Nombre)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(p => p.Email)
            .IsRequired()
            .HasMaxLength(254);

        builder.Property(p => p.Empresa)
            .HasMaxLength(200);

        builder.Property(p => p.PuedeGenerarCertificado)
            .HasDefaultValue(false);

        builder.Property(p => p.CreatedAt)
            .HasColumnType("timestamptz")
            .HasDefaultValueSql("NOW()")
            .ValueGeneratedOnAdd();

        builder.HasIndex(p => new { p.ConferenciaId, p.Email })
            .IsUnique();

        builder.HasOne(p => p.Conferencia)
            .WithMany()
            .HasForeignKey(p => p.ConferenciaId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
