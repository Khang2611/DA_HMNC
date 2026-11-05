using FluentValidation;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace SmartInventory.Modules.Identity;

public static class IdentityModule
{
    public static IServiceCollection AddIdentityModule(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddMediatR(cfg =>
        {
            cfg.RegisterServicesFromAssembly(typeof(IdentityModule).Assembly);
        });

        services.AddValidatorsFromAssembly(typeof(IdentityModule).Assembly, includeInternalTypes: true);

        return services;
    }
}
