using ConferenceManager.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ConferenceManager.Data.Configurations;

public class AvisoUrgenteConfiguration : IEntityTypeConfiguration<AvisoUrgente>
{
    public void Configure(EntityTypeBuilder<AvisoUrgente> builder)
    {
        builder.ToTable("avisos_urgentes");

        builder.HasKey(a => a.Id);
        builder.Property(a => a.Id)
            .HasDefaultValueSql("gen_random_uuid()");

        builder.Property(a => a.Mensaje)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(a => a.Activo)
            .HasDefaultValue(true);

        builder.Property(a => a.CreatedAt)
            .HasColumnType("timestamptz")
            .HasDefaultValueSql("NOW()")
            .ValueGeneratedOnAdd();

        builder.HasIndex(a => new { a.ConferenciaId, a.Activo });

        builder.HasOne(a => a.Conferencia)
            .WithMany()
            .HasForeignKey(a => a.ConferenciaId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
