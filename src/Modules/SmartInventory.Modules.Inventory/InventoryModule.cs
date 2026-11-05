using FluentValidation;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace SmartInventory.Modules.Inventory;

public static class InventoryModule
{
    public static IServiceCollection AddInventoryModule(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddMediatR(cfg =>
        {
            cfg.RegisterServicesFromAssembly(typeof(InventoryModule).Assembly);
        });

        services.AddValidatorsFromAssembly(typeof(InventoryModule).Assembly, includeInternalTypes: true);

        return services;
    }
}
