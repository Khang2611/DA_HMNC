using MediatR;
using Microsoft.EntityFrameworkCore;
using SmartInventory.Contracts.Identity;
using SmartInventory.Modules.Identity.Application.DTOs;
using SmartInventory.Modules.Identity.Domain;
using SmartInventory.Modules.Identity.Infrastructure.Data;
using SmartInventory.SharedKernel.Exceptions;

namespace SmartInventory.Modules.Identity.Application.UseCases.UpdateAccount;

public class UpdateAccountCommandHandler : IRequestHandler<UpdateAccountCommand, AccountDto>
{
    private readonly IdentityDbContext _dbContext;
    private readonly ICurrentUser _currentUser;

    public UpdateAccountCommandHandler(IdentityDbContext dbContext, ICurrentUser currentUser)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
    }

    public async Task<AccountDto> Handle(UpdateAccountCommand request, CancellationToken cancellationToken)
    {
        var account = await _dbContext.Accounts
            .FirstOrDefaultAsync(a => a.Id == request.Id, cancellationToken);

        if (account == null)
        {
            throw new NotFoundException($"Không tìm thấy tài khoản với Id {request.Id}.");
        }

        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        var emailExists = await _dbContext.Accounts
            .AnyAsync(a => a.Email == normalizedEmail && a.Id != request.Id, cancellationToken);

        if (emailExists)
        {
            throw new ConflictException("Email đã được sử dụng bởi tài khoản khác.");
        }

        var activeAdminCount = await _dbContext.Accounts
            .CountAsync(a => a.Role == AccountRole.QTV && a.Status == AccountStatus.Active, cancellationToken);

        var currentUserId = _currentUser.UserId ?? 0;

        account.UpdateProfile(
            request.FullName,
            normalizedEmail,
            request.PhoneNumber,
            request.DateOfBirth,
            request.Address,
            request.Role,
            currentUserId,
            activeAdminCount);

        await _dbContext.SaveChangesAsync(cancellationToken);

        return AccountDto.FromEntity(account);
    }
}
