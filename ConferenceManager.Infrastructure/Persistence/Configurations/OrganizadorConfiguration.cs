using ConferenceManager.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ConferenceManager.Data.Configurations;

public class OrganizadorConfiguration : IEntityTypeConfiguration<Organizador>
{
    public void Configure(EntityTypeBuilder<Organizador> builder)
    {
        builder.ToTable("organizadores");

        builder.HasKey(o => o.Id);
        builder.Property(o => o.Id)
            .HasDefaultValueSql("gen_random_uuid()");

        builder.Property(o => o.Nombre)
            .IsRequired()
            .HasColumnType("text");

        builder.Property(o => o.LogoUrl)
            .HasColumnType("text");

        builder.Property(o => o.Orden)
            .IsRequired();

        builder.HasOne(o => o.Conferencia)
            .WithMany(c => c.Organizadores)
            .HasForeignKey(o => o.ConferenciaId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(o => o.ConferenciaId);
    }
}
