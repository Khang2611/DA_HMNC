using MediatR;
using SmartInventory.Modules.Identity.Application.DTOs;
using SmartInventory.Modules.Identity.Domain;

namespace SmartInventory.Modules.Identity.Application.UseCases.GetAccounts;

public record GetAccountsQuery(
    int Page = 1,
    int PageSize = 20,
    string? Search = null,
    AccountRole? Role = null,
    AccountStatus? Status = null) : IRequest<PagedResult<AccountDto>>;
