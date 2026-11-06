using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using SmartInventory.Modules.Identity.Domain;
using SmartInventory.SharedKernel.Exceptions;

namespace SmartInventory.Modules.Identity.Infrastructure.Data;

public class IdentityDbContext : DbContext
{
    public IdentityDbContext(DbContextOptions<IdentityDbContext> options)
        : base(options)
    {
    }

    public DbSet<Account> Accounts => Set<Account>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfiguration(new AccountConfiguration());
    }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            return await base.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException ex)
        {
            throw new ConflictException("Dữ liệu đã bị thay đổi bởi người dùng khác hoặc giao dịch khác. Vui lòng tải lại và thử lại.", ex);
        }
        catch (DbUpdateException ex) when (IsUniqueConstraintViolation(ex))
        {
            throw new ConflictException("Tên đăng nhập hoặc Email đã tồn tại trong hệ thống.", ex);
        }
    }

    private static bool IsUniqueConstraintViolation(DbUpdateException ex)
    {
        if (ex.InnerException is SqlException sqlEx)
        {
            // 2627: Unique constraint violation, 2601: Duplicate key row error
            return sqlEx.Number is 2627 or 2601;
        }

        return false;
    }
}
