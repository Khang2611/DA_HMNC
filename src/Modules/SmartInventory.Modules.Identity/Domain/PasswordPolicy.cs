namespace SmartInventory.Modules.Identity.Domain;

public static class PasswordPolicy
{
    public const int MinLength = 8;

    public static bool IsValid(string? password)
    {
        if (string.IsNullOrEmpty(password) || password.Length < MinLength)
        {
            return false;
        }

        var hasUpper = password.Any(char.IsUpper);
        var hasLower = password.Any(char.IsLower);
        var hasDigit = password.Any(char.IsDigit);

        return hasUpper && hasLower && hasDigit;
    }
}
