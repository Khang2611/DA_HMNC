using System.Threading.RateLimiting;
using MediatR;
using SmartInventory.Api.Middlewares;
using SmartInventory.Modules.Catalog;
using SmartInventory.Modules.Forecasting;
using SmartInventory.Modules.Identity;
using SmartInventory.Modules.Identity.Endpoints;
using SmartInventory.Modules.Identity.Infrastructure.Data;
using SmartInventory.Modules.Identity.Infrastructure.Security;
using SmartInventory.Modules.Inventory;
using SmartInventory.Modules.Procurement;
using SmartInventory.SharedKernel.Behaviors;

var builder = WebApplication.CreateBuilder(args);

// Validate JWT configuration on startup
var jwtOptions = builder.Configuration.GetSection(JwtOptions.SectionName).Get<JwtOptions>() ?? new JwtOptions();
jwtOptions.Validate();

// Problem details & Exception handling
builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<DomainExceptionHandler>();

// Health checks
builder.Services.AddHealthChecks();

// Rate limiting
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddPolicy(IdentityEndpoints.LoginRateLimiterPolicy, httpContext =>
    {
        var clientIp = httpContext.Connection.RemoteIpAddress?.ToString()
            ?? httpContext.Request.Headers["X-Forwarded-For"].FirstOrDefault()
            ?? "unknown-ip";

        return RateLimitPartition.GetFixedWindowLimiter(
            clientIp,
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 5,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0
            });
    });
});

// Validation pipeline behavior (registered once)
builder.Services.AddTransient(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));

// Register modules
builder.Services.AddIdentityModule(builder.Configuration);
builder.Services.AddCatalogModule(builder.Configuration);
builder.Services.AddInventoryModule(builder.Configuration);
builder.Services.AddProcurementModule(builder.Configuration);
builder.Services.AddForecastingModule(builder.Configuration);

var app = builder.Build();

app.UseExceptionHandler();

app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

app.MapHealthChecks("/health");

app.MapGet("/api/v1/ping", () => Results.Ok(new
{
    message = "pong",
    timestamp = DateTime.UtcNow
}));

// Map module endpoints
app.MapIdentityEndpoints();

// Bootstrap initial admin if configured
await IdentityDbInitializer.BootstrapAdminAsync(app.Services, app.Configuration, app.Logger);

app.Run();

public partial class Program
{
}
