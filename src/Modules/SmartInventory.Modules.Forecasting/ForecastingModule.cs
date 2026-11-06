using FluentValidation;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace SmartInventory.Modules.Forecasting;

public static class ForecastingModule
{
    public static IServiceCollection AddForecastingModule(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddMediatR(cfg =>
        {
            cfg.RegisterServicesFromAssembly(typeof(ForecastingModule).Assembly);
        });

        services.AddValidatorsFromAssembly(typeof(ForecastingModule).Assembly, includeInternalTypes: true);

        return services;
    }
}
