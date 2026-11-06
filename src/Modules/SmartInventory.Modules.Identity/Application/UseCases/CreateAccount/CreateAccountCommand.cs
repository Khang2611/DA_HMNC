using MediatR;
using SmartInventory.Modules.Identity.Application.DTOs;
using SmartInventory.Modules.Identity.Domain;

namespace SmartInventory.Modules.Identity.Application.UseCases.CreateAccount;

public record CreateAccountCommand(
    string Username,
    string Password,
    string FullName,
    string Email,
    AccountRole Role,
    string? PhoneNumber = null,
    DateOnly? DateOfBirth = null,
    string? Address = null) : IRequest<AccountDto>;
