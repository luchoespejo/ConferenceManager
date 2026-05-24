using System.Text.Json;
using ConferenceManager.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

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

        var jsonDocConverter = new ValueConverter<JsonDocument?, string?>(
            v => v == null ? null : v.RootElement.GetRawText(),
            v => v == null ? null : JsonDocument.Parse(v));

        builder.Property(e => e.RedesSociales)
            .HasColumnType("jsonb")
            .HasConversion(jsonDocConverter);

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
