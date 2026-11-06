using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SmartInventory.Modules.Identity.Domain;

namespace SmartInventory.Modules.Identity.Infrastructure.Data;

public class AccountConfiguration : IEntityTypeConfiguration<Account>
{
    public void Configure(EntityTypeBuilder<Account> builder)
    {
        builder.ToTable("Accounts", "dbo");

        builder.HasKey(a => a.Id);

        builder.Property(a => a.Id)
            .ValueGeneratedOnAdd();

        builder.Property(a => a.Username)
            .HasMaxLength(50)
            .IsRequired()
            .IsUnicode(true);

        builder.HasIndex(a => a.Username)
            .IsUnique();

        builder.Property(a => a.PasswordHash)
            .HasMaxLength(255)
            .IsRequired()
            .IsUnicode(true);

        builder.Property(a => a.FullName)
            .HasMaxLength(150)
            .IsRequired()
            .IsUnicode(true);

        builder.Property(a => a.Email)
            .HasMaxLength(254)
            .IsRequired()
            .IsUnicode(false);

        builder.HasIndex(a => a.Email)
            .IsUnique();

        builder.Property(a => a.PhoneNumber)
            .HasMaxLength(20)
            .IsUnicode(false);

        builder.Property(a => a.DateOfBirth)
            .HasColumnType("date");

        builder.Property(a => a.Address)
            .HasMaxLength(255)
            .IsUnicode(true);

        builder.Property(a => a.Role)
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired()
            .IsUnicode(false);

        builder.Property(a => a.Status)
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired()
            .IsUnicode(false)
            .HasDefaultValue(AccountStatus.Active);

        builder.Property(a => a.CreatedAt)
            .HasColumnType("datetime2(0)")
            .ValueGeneratedOnAdd()
            .HasDefaultValueSql("SYSDATETIME()");

        builder.Property(a => a.UpdatedAt)
            .HasColumnType("datetime2(0)");

        builder.Property(a => a.RowVersion)
            .IsRowVersion();
    }
}
