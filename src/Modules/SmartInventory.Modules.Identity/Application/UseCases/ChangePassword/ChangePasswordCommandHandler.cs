using MediatR;
using Microsoft.EntityFrameworkCore;
using SmartInventory.Contracts.Identity;
using SmartInventory.Modules.Identity.Infrastructure.Data;
using SmartInventory.Modules.Identity.Infrastructure.Security;
using SmartInventory.SharedKernel.Exceptions;

namespace SmartInventory.Modules.Identity.Application.UseCases.ChangePassword;

public class ChangePasswordCommandHandler : IRequestHandler<ChangePasswordCommand>
{
    private readonly IdentityDbContext _dbContext;
    private readonly ICurrentUser _currentUser;
    private readonly IPasswordHasher _passwordHasher;

    public ChangePasswordCommandHandler(
        IdentityDbContext dbContext,
        ICurrentUser currentUser,
        IPasswordHasher passwordHasher)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
        _passwordHasher = passwordHasher;
    }

    public async Task Handle(ChangePasswordCommand request, CancellationToken cancellationToken)
    {
        if (!_currentUser.IsAuthenticated || !_currentUser.UserId.HasValue)
        {
            throw new UnauthorizedException("Người dùng chưa được xác thực.");
        }

        var account = await _dbContext.Accounts
            .FirstOrDefaultAsync(a => a.Id == _currentUser.UserId.Value, cancellationToken);

        if (account == null)
        {
            throw new NotFoundException($"Không tìm thấy tài khoản với Id {_currentUser.UserId.Value}.");
        }

        if (!_passwordHasher.VerifyPassword(request.OldPassword, account.PasswordHash))
        {
            throw new DomainException("Mật khẩu cũ không chính xác.");
        }

        if (request.OldPassword == request.NewPassword)
        {
            throw new DomainException("Mật khẩu mới không được trùng với mật khẩu cũ.");
        }

        var newHash = _passwordHasher.HashPassword(request.NewPassword);
        account.ChangePassword(newHash);

        await _dbContext.SaveChangesAsync(cancellationToken);
    }
}
