using ConferenceManager.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ConferenceManager.Data.Configurations;

public class ConferenciaLayoutConfiguration : IEntityTypeConfiguration<ConferenciaLayout>
{
    public void Configure(EntityTypeBuilder<ConferenciaLayout> builder)
    {
        builder.ToTable("conferencia_layouts");

        builder.HasKey(l => l.Id);
        builder.Property(l => l.Id)
            .HasDefaultValueSql("gen_random_uuid()");

        builder.Property(l => l.Nombre)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(l => l.LayoutJson)
            .HasColumnType("text")
            .IsRequired();

        builder.Property(l => l.IsActive)
            .IsRequired()
            .HasDefaultValue(false);

        builder.Property(l => l.CreatedAt)
            .HasColumnType("timestamptz")
            .HasDefaultValueSql("NOW()")
            .ValueGeneratedOnAdd();

        builder.Property(l => l.UpdatedAt)
            .HasColumnType("timestamptz")
            .HasDefaultValueSql("NOW()");

        builder.HasOne(l => l.Conferencia)
            .WithMany(c => c.Layouts)
            .HasForeignKey(l => l.ConferenciaId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(l => l.ConferenciaId);
        // Solo un activo por conferencia (enforced en app layer, pero índice parcial ayuda)
        builder.HasIndex(l => new { l.ConferenciaId, l.IsActive });
    }
}
