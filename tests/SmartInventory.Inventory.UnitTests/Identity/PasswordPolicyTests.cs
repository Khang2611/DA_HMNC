using SmartInventory.Modules.Identity.Domain;

namespace SmartInventory.Inventory.UnitTests.Identity;

public class PasswordPolicyTests
{
    [Theory]
    [InlineData("Abc12345", true)]
    [InlineData("PassWord999!", true)]
    [InlineData("SmartInventory2026", true)]
    [InlineData("short1A", false)]          // < 8 chars
    [InlineData("alllowercase123", false)]  // no uppercase
    [InlineData("ALLUPPERCASE123", false)]  // no lowercase
    [InlineData("NoDigitsInPassword", false)] // no digit
    [InlineData("", false)]
    [InlineData(null, false)]
    public void IsValid_ValidatesPasswordComplexityCorrectly(string? password, bool expected)
    {
        var result = PasswordPolicy.IsValid(password);
        Assert.Equal(expected, result);
    }
}
