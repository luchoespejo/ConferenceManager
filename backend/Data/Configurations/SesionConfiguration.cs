using ConferenceManager.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ConferenceManager.Data.Configurations;

public class SesionConfiguration : IEntityTypeConfiguration<Sesion>
{
    public void Configure(EntityTypeBuilder<Sesion> builder)
    {
        builder.ToTable("sesiones");

        builder.HasKey(e => e.Id);
        builder.Property(e => e.Id)
            .HasDefaultValueSql("gen_random_uuid()");

        builder.Property(e => e.Titulo)
            .IsRequired()
            .HasMaxLength(255);

        builder.Property(e => e.Fecha)
            .HasColumnType("date")
            .IsRequired();

        builder.Property(e => e.HoraInicio)
            .HasColumnType("time")
            .IsRequired();

        builder.Property(e => e.HoraFin)
            .HasColumnType("time")
            .IsRequired();

        builder.Property(e => e.Track)
            .HasMaxLength(100);

        builder.Property(e => e.EncuestaUrl)
            .HasMaxLength(500);

        builder.Property(e => e.QrCodeUrl)
            .HasColumnType("text");

        builder.Property(e => e.CreatedAt)
            .HasColumnType("timestamptz")
            .HasDefaultValueSql("NOW()")
            .ValueGeneratedOnAdd();

        builder.HasOne(e => e.Conferencia)
            .WithMany()
            .HasForeignKey(e => e.ConferenciaId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(e => e.Sala)
            .WithMany()
            .HasForeignKey(e => e.SalaId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(e => e.Expositor)
            .WithMany()
            .HasForeignKey(e => e.ExpositorId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(e => e.ConferenciaId);
        builder.HasIndex(e => e.SalaId);
        builder.HasIndex(e => e.ExpositorId);
        builder.HasIndex(e => e.Fecha);
    }
}
