using ConferenceManager.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ConferenceManager.Data.Configurations;

public class ConferenciaConfiguration : IEntityTypeConfiguration<Conferencia>
{
    public void Configure(EntityTypeBuilder<Conferencia> builder)
    {
        builder.ToTable("conferencias");

        builder.HasKey(c => c.Id);
        builder.Property(c => c.Id)
            .HasDefaultValueSql("gen_random_uuid()");

        builder.Property(c => c.Nombre)
            .IsRequired()
            .HasMaxLength(255);

        builder.Property(c => c.Slug)
            .IsRequired()
            .HasMaxLength(50);

        builder.HasIndex(c => c.Slug)
            .IsUnique();

        builder.Property(c => c.Descripcion)
            .HasColumnType("text");

        builder.Property(c => c.FechaInicio)
            .HasColumnType("date")
            .IsRequired();

        builder.Property(c => c.FechaFin)
            .HasColumnType("date")
            .IsRequired();

        builder.Property(c => c.Estado)
            .HasConversion<string>()
            .HasDefaultValue(ConferenciaEstado.Borrador)
            .IsRequired();

        builder.Property(c => c.LogoUrl)
            .HasColumnType("text");

        builder.Property(c => c.LogoSecundarioUrl)
            .HasColumnType("text");

        builder.Property(c => c.BannerUrl)
            .HasColumnType("text");

        builder.Property(c => c.FaviconUrl)
            .HasColumnType("text");

        builder.Property(c => c.ColorPrimario)
            .HasMaxLength(7);

        builder.Property(c => c.ColorSecundario)
            .HasMaxLength(7);

        builder.Property(c => c.Tipografia)
            .HasMaxLength(100);

        builder.Property(c => c.VenueNombre)
            .HasColumnType("text");

        builder.Property(c => c.VenueDireccion)
            .HasColumnType("text");

        builder.Property(c => c.VenueLinkMaps)
            .HasColumnType("text");

        builder.Property(c => c.CreatedAt)
            .HasColumnType("timestamptz")
            .HasDefaultValueSql("NOW()")
            .ValueGeneratedOnAdd();

        builder.HasOne(c => c.Usuario)
            .WithMany()
            .HasForeignKey(c => c.UsuarioId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(c => new { c.UsuarioId, c.Estado });
    }
}
