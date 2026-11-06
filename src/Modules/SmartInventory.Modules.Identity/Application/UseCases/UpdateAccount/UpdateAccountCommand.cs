using MediatR;
using SmartInventory.Modules.Identity.Application.DTOs;
using SmartInventory.Modules.Identity.Domain;

namespace SmartInventory.Modules.Identity.Application.UseCases.UpdateAccount;

public record UpdateAccountCommand(
    int Id,
    string FullName,
    string Email,
    AccountRole Role,
    string? PhoneNumber = null,
    DateOnly? DateOfBirth = null,
    string? Address = null) : IRequest<AccountDto>;
