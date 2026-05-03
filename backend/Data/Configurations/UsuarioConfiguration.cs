using ConferenceManager.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ConferenceManager.Data.Configurations;

public class UsuarioConfiguration : IEntityTypeConfiguration<Usuario>
{
    public void Configure(EntityTypeBuilder<Usuario> builder)
    {
        builder.ToTable("usuarios");

        builder.HasKey(u => u.Id);
        builder.Property(u => u.Id)
            .HasDefaultValueSql("gen_random_uuid()");

        builder.Property(u => u.Email)
            .IsRequired()
            .HasMaxLength(254);

        builder.HasIndex(u => u.Email)
            .IsUnique();

        builder.Property(u => u.PasswordHash)
            .IsRequired()
            .HasColumnType("text");

        builder.Property(u => u.Nombre)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(u => u.Organizacion)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(u => u.EmailVerificado)
            .HasDefaultValue(false);

        builder.Property(u => u.Activo)
            .HasDefaultValue(true);

        builder.Property(u => u.VerificationToken)
            .HasMaxLength(32)
            .IsRequired(false);

        builder.HasIndex(u => u.VerificationToken);

        builder.Property(u => u.VerificationTokenExpiresAt)
            .HasColumnType("timestamptz")
            .IsRequired(false);

        builder.Property(u => u.CreatedAt)
            .HasColumnType("timestamptz")
            .HasDefaultValueSql("NOW()")
            .ValueGeneratedOnAdd();
    }
}
