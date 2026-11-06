using System.Text;
using FluentValidation;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using SmartInventory.Contracts.Identity;
using SmartInventory.Modules.Identity.Infrastructure.Data;
using SmartInventory.Modules.Identity.Infrastructure.Security;
using SmartInventory.Modules.Identity.Infrastructure.Services;

namespace SmartInventory.Modules.Identity;

public static class IdentityModule
{
    public static IServiceCollection AddIdentityModule(this IServiceCollection services, IConfiguration configuration)
    {
        // MediatR & Validators
        services.AddMediatR(cfg =>
        {
            cfg.RegisterServicesFromAssembly(typeof(IdentityModule).Assembly);
        });

        services.AddValidatorsFromAssembly(typeof(IdentityModule).Assembly, includeInternalTypes: true);

        // Database
        var connectionString = configuration.GetConnectionString("Default");
        services.AddDbContext<IdentityDbContext>(options =>
        {
            if (!string.IsNullOrWhiteSpace(connectionString))
            {
                options.UseSqlServer(connectionString);
            }
        });

        // Security & Services
        var jwtSection = configuration.GetSection(JwtOptions.SectionName);
        services.Configure<JwtOptions>(jwtSection);
        var jwtOptions = jwtSection.Get<JwtOptions>();

        services.AddSingleton<IPasswordHasher, BcryptPasswordHasher>();
        services.AddScoped<ITokenService, JwtTokenService>();
        services.AddHttpContextAccessor();
        services.AddScoped<ICurrentUser, CurrentUser>();

        // Authentication
        services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer(options =>
        {
            options.MapInboundClaims = false;
            if (jwtOptions != null && !string.IsNullOrWhiteSpace(jwtOptions.SigningKey))
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidIssuer = jwtOptions.Issuer,
                    ValidateAudience = true,
                    ValidAudience = jwtOptions.Audience,
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOptions.SigningKey)),
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.Zero,
                    RoleClaimType = "role",
                    NameClaimType = "unique_name"
                };
            }
        });

        // Authorization Policies
        services.AddAuthorization(options =>
        {
            options.AddPolicy(Policies.RequireAdmin, policy =>
                policy.RequireRole(Roles.QTV));

            options.AddPolicy(Policies.RequireWarehouseManager, policy =>
                policy.RequireRole(Roles.QuanLyKho, Roles.GiamDoc, Roles.QTV));

            options.AddPolicy(Policies.RequireAuthenticated, policy =>
                policy.RequireAuthenticatedUser());
        });

        return services;
    }
}
