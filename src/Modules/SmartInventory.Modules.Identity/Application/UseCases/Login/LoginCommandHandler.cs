using MediatR;
using Microsoft.EntityFrameworkCore;
using SmartInventory.Modules.Identity.Application.DTOs;
using SmartInventory.Modules.Identity.Domain;
using SmartInventory.Modules.Identity.Infrastructure.Data;
using SmartInventory.Modules.Identity.Infrastructure.Security;
using SmartInventory.SharedKernel.Exceptions;

namespace SmartInventory.Modules.Identity.Application.UseCases.Login;

public class LoginCommandHandler : IRequestHandler<LoginCommand, LoginResponse>
{
    private readonly IdentityDbContext _dbContext;
    private readonly IPasswordHasher _passwordHasher;
    private readonly ITokenService _tokenService;

    public LoginCommandHandler(
        IdentityDbContext dbContext,
        IPasswordHasher passwordHasher,
        ITokenService tokenService)
    {
        _dbContext = dbContext;
        _passwordHasher = passwordHasher;
        _tokenService = tokenService;
    }

    public async Task<LoginResponse> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        var normalizedUsername = request.Username.Trim();
        var account = await _dbContext.Accounts
            .FirstOrDefaultAsync(a => a.Username == normalizedUsername, cancellationToken);

        if (account == null)
        {
            _passwordHasher.VerifyDummyPassword(request.Password);
            throw new UnauthorizedException("Tên đăng nhập hoặc mật khẩu không chính xác.");
        }

        var isPasswordValid = _passwordHasher.VerifyPassword(request.Password, account.PasswordHash);
        if (!isPasswordValid)
        {
            throw new UnauthorizedException("Tên đăng nhập hoặc mật khẩu không chính xác.");
        }

        if (account.Status != AccountStatus.Active)
        {
            var reason = account.Status == AccountStatus.Locked
                ? "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên."
                : "Tài khoản của bạn chưa được kích hoạt.";

            throw new ForbiddenException(reason);
        }

        var (token, expiresIn) = _tokenService.GenerateToken(account);
        return new LoginResponse(token, expiresIn, AccountDto.FromEntity(account));
    }
}
