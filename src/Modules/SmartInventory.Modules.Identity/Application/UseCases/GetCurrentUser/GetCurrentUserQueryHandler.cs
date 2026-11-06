using MediatR;
using Microsoft.EntityFrameworkCore;
using SmartInventory.Contracts.Identity;
using SmartInventory.Modules.Identity.Application.DTOs;
using SmartInventory.Modules.Identity.Infrastructure.Data;
using SmartInventory.SharedKernel.Exceptions;

namespace SmartInventory.Modules.Identity.Application.UseCases.GetCurrentUser;

public class GetCurrentUserQueryHandler : IRequestHandler<GetCurrentUserQuery, AccountDto>
{
    private readonly IdentityDbContext _dbContext;
    private readonly ICurrentUser _currentUser;

    public GetCurrentUserQueryHandler(IdentityDbContext dbContext, ICurrentUser currentUser)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
    }

    public async Task<AccountDto> Handle(GetCurrentUserQuery request, CancellationToken cancellationToken)
    {
        if (!_currentUser.IsAuthenticated || !_currentUser.UserId.HasValue)
        {
            throw new UnauthorizedException("Người dùng chưa được xác thực.");
        }

        var account = await _dbContext.Accounts
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.Id == _currentUser.UserId.Value, cancellationToken);

        if (account == null)
        {
            throw new NotFoundException($"Không tìm thấy tài khoản với Id {_currentUser.UserId.Value}.");
        }

        return AccountDto.FromEntity(account);
    }
}
