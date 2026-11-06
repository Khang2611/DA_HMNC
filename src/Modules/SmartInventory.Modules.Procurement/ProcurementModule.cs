using FluentValidation;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace SmartInventory.Modules.Procurement;

public static class ProcurementModule
{
    public static IServiceCollection AddProcurementModule(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddMediatR(cfg =>
        {
            cfg.RegisterServicesFromAssembly(typeof(ProcurementModule).Assembly);
        });

        services.AddValidatorsFromAssembly(typeof(ProcurementModule).Assembly, includeInternalTypes: true);

        return services;
    }
}
