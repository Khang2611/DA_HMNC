using FluentValidation.TestHelper;
using SmartInventory.Modules.Identity.Application.UseCases.CreateAccount;
using SmartInventory.Modules.Identity.Application.UseCases.GetAccounts;
using SmartInventory.Modules.Identity.Application.UseCases.Login;
using SmartInventory.Modules.Identity.Application.UseCases.UpdateAccountStatus;
using SmartInventory.Modules.Identity.Domain;

namespace SmartInventory.Inventory.UnitTests.Identity;

public class ValidatorTests
{
    [Fact]
    public void LoginCommandValidator_WhenEmpty_HasErrors()
    {
        var validator = new LoginCommandValidator();
        var command = new LoginCommand("", "");

        var result = validator.TestValidate(command);

        result.ShouldHaveValidationErrorFor(x => x.Username);
        result.ShouldHaveValidationErrorFor(x => x.Password);
    }

    [Fact]
    public void LoginCommandValidator_WhenValid_NoErrors()
    {
        var validator = new LoginCommandValidator();
        var command = new LoginCommand("admin", "ValidPassword123");

        var result = validator.TestValidate(command);

        result.ShouldNotHaveAnyValidationErrors();
    }

    [Theory]
    [InlineData("ab")] // too short (<3)
    [InlineData("invalid username with space")]
    [InlineData("invalid@char#")]
    public void CreateAccountCommandValidator_InvalidUsername_HasErrors(string username)
    {
        var validator = new CreateAccountCommandValidator();
        var command = new CreateAccountCommand(username, "ValidPassword123", "Full Name", "test@test.com", AccountRole.NhanVienKho);

        var result = validator.TestValidate(command);

        result.ShouldHaveValidationErrorFor(x => x.Username);
    }

    [Theory]
    [InlineData("weakpass")]
    [InlineData("short1A")]
    public void CreateAccountCommandValidator_InvalidPassword_HasErrors(string password)
    {
        var validator = new CreateAccountCommandValidator();
        var command = new CreateAccountCommand("valid_user", password, "Full Name", "test@test.com", AccountRole.NhanVienKho);

        var result = validator.TestValidate(command);

        result.ShouldHaveValidationErrorFor(x => x.Password);
    }

    [Fact]
    public void CreateAccountCommandValidator_InvalidEmail_HasErrors()
    {
        var validator = new CreateAccountCommandValidator();
        var command = new CreateAccountCommand("valid_user", "ValidPassword123", "Full Name", "not-an-email", AccountRole.NhanVienKho);

        var result = validator.TestValidate(command);

        result.ShouldHaveValidationErrorFor(x => x.Email);
    }

    [Fact]
    public void GetAccountsQueryValidator_InvalidPagination_HasErrors()
    {
        var validator = new GetAccountsQueryValidator();
        var queryZeroPage = new GetAccountsQuery(Page: 0, PageSize: 20);
        var queryTooLargeSize = new GetAccountsQuery(Page: 1, PageSize: 101);

        validator.TestValidate(queryZeroPage).ShouldHaveValidationErrorFor(x => x.Page);
        validator.TestValidate(queryTooLargeSize).ShouldHaveValidationErrorFor(x => x.PageSize);
    }

    [Fact]
    public void UpdateAccountStatusCommandValidator_InvalidId_HasErrors()
    {
        var validator = new UpdateAccountStatusCommandValidator();
        var command = new UpdateAccountStatusCommand(0, AccountStatus.Active);

        var result = validator.TestValidate(command);

        result.ShouldHaveValidationErrorFor(x => x.Id);
    }
}
