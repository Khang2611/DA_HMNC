using SmartInventory.Modules.Identity.Domain;

namespace SmartInventory.Modules.Identity.Infrastructure.Security;

public interface ITokenService
{
    (string Token, int ExpiresIn) GenerateToken(Account account);
}
