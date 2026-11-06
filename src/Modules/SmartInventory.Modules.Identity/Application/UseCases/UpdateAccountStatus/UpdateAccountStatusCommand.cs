using MediatR;
using SmartInventory.Modules.Identity.Application.DTOs;
using SmartInventory.Modules.Identity.Domain;

namespace SmartInventory.Modules.Identity.Application.UseCases.UpdateAccountStatus;

public record UpdateAccountStatusCommand(int Id, AccountStatus Status) : IRequest<AccountDto>;
