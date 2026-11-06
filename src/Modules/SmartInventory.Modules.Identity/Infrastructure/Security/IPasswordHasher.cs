namespace SmartInventory.Modules.Identity.Infrastructure.Security;

public interface IPasswordHasher
{
    string HashPassword(string password);

    bool VerifyPassword(string password, string passwordHash);

    void VerifyDummyPassword(string password);
}
