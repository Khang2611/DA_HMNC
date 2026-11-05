using MediatR;
using SmartInventory.Api.Middlewares;
using SmartInventory.Modules.Catalog;
using SmartInventory.Modules.Forecasting;
using SmartInventory.Modules.Identity;
using SmartInventory.Modules.Inventory;
using SmartInventory.Modules.Procurement;
using SmartInventory.SharedKernel.Behaviors;

var builder = WebApplication.CreateBuilder(args);

// Problem details & Exception handling
builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<DomainExceptionHandler>();

// Health checks
builder.Services.AddHealthChecks();

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

app.MapHealthChecks("/health");

app.MapGet("/api/v1/ping", () => Results.Ok(new
{
    message = "pong",
    timestamp = DateTime.UtcNow
}));

app.Run();

public partial class Program
{
}
