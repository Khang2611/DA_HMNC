using MediatR;
using Microsoft.EntityFrameworkCore;
using SmartInventory.Modules.Identity.Application.DTOs;
using SmartInventory.Modules.Identity.Infrastructure.Data;

namespace SmartInventory.Modules.Identity.Application.UseCases.GetAccounts;

public class GetAccountsQueryHandler : IRequestHandler<GetAccountsQuery, PagedResult<AccountDto>>
{
    private readonly IdentityDbContext _dbContext;

    public GetAccountsQueryHandler(IdentityDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<PagedResult<AccountDto>> Handle(GetAccountsQuery request, CancellationToken cancellationToken)
    {
        var query = _dbContext.Accounts.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim().ToLowerInvariant();
            query = query.Where(a =>
                a.Username.ToLower().Contains(search) ||
                a.FullName.ToLower().Contains(search) ||
                a.Email.ToLower().Contains(search));
        }

        if (request.Role.HasValue)
        {
            query = query.Where(a => a.Role == request.Role.Value);
        }

        if (request.Status.HasValue)
        {
            query = query.Where(a => a.Status == request.Status.Value);
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var accounts = await query
            .OrderByDescending(a => a.CreatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(cancellationToken);

        var items = accounts.Select(AccountDto.FromEntity).ToList();

        return new PagedResult<AccountDto>(items, totalCount, request.Page, request.PageSize);
    }
}
