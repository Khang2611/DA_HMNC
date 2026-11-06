using MediatR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using SmartInventory.Contracts.Identity;
using SmartInventory.Modules.Identity.Application.UseCases.ChangePassword;
using SmartInventory.Modules.Identity.Application.UseCases.CreateAccount;
using SmartInventory.Modules.Identity.Application.UseCases.GetAccountById;
using SmartInventory.Modules.Identity.Application.UseCases.GetAccounts;
using SmartInventory.Modules.Identity.Application.UseCases.GetCurrentUser;
using SmartInventory.Modules.Identity.Application.UseCases.Login;
using SmartInventory.Modules.Identity.Application.UseCases.UpdateAccount;
using SmartInventory.Modules.Identity.Application.UseCases.UpdateAccountStatus;
using SmartInventory.Modules.Identity.Domain;

namespace SmartInventory.Modules.Identity.Endpoints;

public static class IdentityEndpoints
{
    public const string LoginRateLimiterPolicy = "LoginRateLimiter";

    public static IEndpointRouteBuilder MapIdentityEndpoints(this IEndpointRouteBuilder app)
    {
        var authGroup = app.MapGroup("/api/v1/auth")
            .WithTags("Auth");

        authGroup.MapPost("/login", async (LoginCommand command, ISender sender) =>
        {
            var result = await sender.Send(command);
            return Results.Ok(result);
        })
        .AllowAnonymous()
        .RequireRateLimiting(LoginRateLimiterPolicy);

        authGroup.MapGet("/me", async (ISender sender) =>
        {
            var result = await sender.Send(new GetCurrentUserQuery());
            return Results.Ok(result);
        })
        .RequireAuthorization(Policies.RequireAuthenticated);

        authGroup.MapPost("/change-password", async (ChangePasswordCommand command, ISender sender) =>
        {
            await sender.Send(command);
            return Results.NoContent();
        })
        .RequireAuthorization(Policies.RequireAuthenticated);

        var accountsGroup = app.MapGroup("/api/v1/accounts")
            .WithTags("Accounts")
            .RequireAuthorization(Policies.RequireAdmin);

        accountsGroup.MapGet("/", async (
            int? page,
            int? pageSize,
            string? search,
            AccountRole? role,
            AccountStatus? status,
            ISender sender) =>
        {
            var query = new GetAccountsQuery(
                page ?? 1,
                pageSize ?? 20,
                search,
                role,
                status);

            var result = await sender.Send(query);
            return Results.Ok(result);
        });

        accountsGroup.MapGet("/{id:int}", async (int id, ISender sender) =>
        {
            var result = await sender.Send(new GetAccountByIdQuery(id));
            return Results.Ok(result);
        });

        accountsGroup.MapPost("/", async (CreateAccountCommand command, ISender sender) =>
        {
            var result = await sender.Send(command);
            return Results.Created($"/api/v1/accounts/{result.Id}", result);
        });

        accountsGroup.MapPut("/{id:int}", async (int id, UpdateAccountRequest request, ISender sender) =>
        {
            var command = new UpdateAccountCommand(
                id,
                request.FullName,
                request.Email,
                request.Role,
                request.PhoneNumber,
                request.DateOfBirth,
                request.Address);

            var result = await sender.Send(command);
            return Results.Ok(result);
        });

        accountsGroup.MapPut("/{id:int}/status", async (int id, UpdateAccountStatusRequest request, ISender sender) =>
        {
            var command = new UpdateAccountStatusCommand(id, request.Status);
            var result = await sender.Send(command);
            return Results.Ok(result);
        });

        return app;
    }
}

public record UpdateAccountRequest(
    string FullName,
    string Email,
    AccountRole Role,
    string? PhoneNumber = null,
    DateOnly? DateOfBirth = null,
    string? Address = null);

public record UpdateAccountStatusRequest(AccountStatus Status);
