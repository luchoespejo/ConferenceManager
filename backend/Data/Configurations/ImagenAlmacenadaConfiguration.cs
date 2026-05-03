using ConferenceManager.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ConferenceManager.Data.Configurations;

public class ImagenAlmacenadaConfiguration : IEntityTypeConfiguration<ImagenAlmacenada>
{
    public void Configure(EntityTypeBuilder<ImagenAlmacenada> builder)
    {
        builder.ToTable("imagenes_almacenadas");

        builder.HasKey(i => i.Id);
        builder.Property(i => i.Id)
            .HasDefaultValueSql("gen_random_uuid()");

        builder.Property(i => i.ContentType)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(i => i.Datos)
            .IsRequired();

        builder.Property(i => i.CreatedAt)
            .HasColumnType("timestamptz")
            .HasDefaultValueSql("NOW()")
            .ValueGeneratedOnAdd();

        builder.HasIndex(i => i.UsuarioId);
        builder.HasIndex(i => i.CreatedAt);
    }
}
