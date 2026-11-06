using MediatR;
using Microsoft.EntityFrameworkCore;
using SmartInventory.Modules.Identity.Application.DTOs;
using SmartInventory.Modules.Identity.Domain;
using SmartInventory.Modules.Identity.Infrastructure.Data;
using SmartInventory.Modules.Identity.Infrastructure.Security;
using SmartInventory.SharedKernel.Exceptions;

namespace SmartInventory.Modules.Identity.Application.UseCases.CreateAccount;

public class CreateAccountCommandHandler : IRequestHandler<CreateAccountCommand, AccountDto>
{
    private readonly IdentityDbContext _dbContext;
    private readonly IPasswordHasher _passwordHasher;

    public CreateAccountCommandHandler(
        IdentityDbContext dbContext,
        IPasswordHasher passwordHasher)
    {
        _dbContext = dbContext;
        _passwordHasher = passwordHasher;
    }

    public async Task<AccountDto> Handle(CreateAccountCommand request, CancellationToken cancellationToken)
    {
        var normalizedUsername = request.Username.Trim();
        var normalizedEmail = request.Email.Trim().ToLowerInvariant();

        var existingAccount = await _dbContext.Accounts
            .AnyAsync(a => a.Username == normalizedUsername || a.Email == normalizedEmail, cancellationToken);

        if (existingAccount)
        {
            throw new ConflictException("Tên đăng nhập hoặc Email đã tồn tại.");
        }

        var passwordHash = _passwordHasher.HashPassword(request.Password);

        var account = Account.Create(
            normalizedUsername,
            passwordHash,
            request.FullName,
            normalizedEmail,
            request.Role,
            request.PhoneNumber,
            request.DateOfBirth,
            request.Address);

        _dbContext.Accounts.Add(account);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return AccountDto.FromEntity(account);
    }
}
