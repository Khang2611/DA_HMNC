using MediatR;
using SmartInventory.Modules.Identity.Application.DTOs;

namespace SmartInventory.Modules.Identity.Application.UseCases.GetCurrentUser;

public record GetCurrentUserQuery : IRequest<AccountDto>;
