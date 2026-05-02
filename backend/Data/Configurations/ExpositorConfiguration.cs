using ConferenceManager.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ConferenceManager.Data.Configurations;

public class ExpositorConfiguration : IEntityTypeConfiguration<Expositor>
{
    public void Configure(EntityTypeBuilder<Expositor> builder)
    {
        builder.ToTable("expositores");

        builder.HasKey(e => e.Id);
        builder.Property(e => e.Id)
            .HasDefaultValueSql("gen_random_uuid()");

        builder.Property(e => e.Nombre)
            .IsRequired()
            .HasMaxLength(255);

        builder.Property(e => e.Email)
            .HasMaxLength(255);

        builder.Property(e => e.TokenAcceso)
            .IsRequired()
            .HasMaxLength(36);

        builder.Property(e => e.RedesSociales)
            .HasColumnType("jsonb");

        builder.Property(e => e.CreatedAt)
            .HasColumnType("timestamptz")
            .HasDefaultValueSql("NOW()")
            .ValueGeneratedOnAdd();

        builder.HasOne(e => e.Conferencia)
            .WithMany()
            .HasForeignKey(e => e.ConferenciaId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(e => e.TokenAcceso)
            .IsUnique();

        builder.HasIndex(e => e.ConferenciaId);
    }
}
