namespace SmartInventory.Modules.Identity.Infrastructure.Security;

public class BcryptPasswordHasher : IPasswordHasher
{
    private const int WorkFactor = 12;

    private static readonly string DummyHash = BCrypt.Net.BCrypt.HashPassword("DummyPasswordForTimingMitigation123!", WorkFactor);

    public string HashPassword(string password)
    {
        return BCrypt.Net.BCrypt.HashPassword(password, WorkFactor);
    }

    public bool VerifyPassword(string password, string passwordHash)
    {
        try
        {
            return BCrypt.Net.BCrypt.Verify(password, passwordHash);
        }
        catch
        {
            return false;
        }
    }

    public void VerifyDummyPassword(string password)
    {
        try
        {
            BCrypt.Net.BCrypt.Verify(password, DummyHash);
        }
        catch
        {
            // intentionally ignored to mitigate timing attacks
        }
    }
}
