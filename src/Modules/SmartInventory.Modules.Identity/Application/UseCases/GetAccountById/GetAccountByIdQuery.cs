using MediatR;
using SmartInventory.Modules.Identity.Application.DTOs;

namespace SmartInventory.Modules.Identity.Application.UseCases.GetAccountById;

public record GetAccountByIdQuery(int Id) : IRequest<AccountDto>;
