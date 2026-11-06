using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using SmartInventory.Modules.Identity.Domain;
using SmartInventory.Modules.Identity.Infrastructure.Security;

namespace SmartInventory.Modules.Identity.Infrastructure.Data;

public static class IdentityDbInitializer
{
    public static async Task BootstrapAdminAsync(IServiceProvider serviceProvider, IConfiguration configuration, ILogger logger)
    {
        var adminUsername = configuration["Bootstrap:AdminUsername"];
        var adminPassword = configuration["Bootstrap:AdminPassword"];
        var adminEmail = configuration["Bootstrap:AdminEmail"];

        if (string.IsNullOrWhiteSpace(adminUsername) ||
            string.IsNullOrWhiteSpace(adminPassword) ||
            string.IsNullOrWhiteSpace(adminEmail))
        {
            return;
        }

        using var scope = serviceProvider.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<IdentityDbContext>();
        var passwordHasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();

        var hasAdmin = await dbContext.Accounts.AnyAsync(a => a.Role == AccountRole.QTV);
        if (!hasAdmin)
        {
            logger.LogInformation("Khởi tạo tài khoản Quản trị viên (QTV) ban đầu: {Username}", adminUsername);

            var passwordHash = passwordHasher.HashPassword(adminPassword);
            var adminAccount = Account.Create(
                adminUsername,
                passwordHash,
                "Quản Trị Viên Hệ Thống",
                adminEmail,
                AccountRole.QTV);

            dbContext.Accounts.Add(adminAccount);
            await dbContext.SaveChangesAsync();
        }
    }
}
