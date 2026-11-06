using MediatR;
using Microsoft.EntityFrameworkCore;
using SmartInventory.Modules.Identity.Application.DTOs;
using SmartInventory.Modules.Identity.Infrastructure.Data;
using SmartInventory.SharedKernel.Exceptions;

namespace SmartInventory.Modules.Identity.Application.UseCases.GetAccountById;

public class GetAccountByIdQueryHandler : IRequestHandler<GetAccountByIdQuery, AccountDto>
{
    private readonly IdentityDbContext _dbContext;

    public GetAccountByIdQueryHandler(IdentityDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<AccountDto> Handle(GetAccountByIdQuery request, CancellationToken cancellationToken)
    {
        var account = await _dbContext.Accounts
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.Id == request.Id, cancellationToken);

        if (account == null)
        {
            throw new NotFoundException($"Không tìm thấy tài khoản với Id {request.Id}.");
        }

        return AccountDto.FromEntity(account);
    }
}
