using SmartInventory.Modules.Identity.Domain;
using SmartInventory.SharedKernel.Exceptions;

namespace SmartInventory.Inventory.UnitTests.Identity;

public class AccountEntityTests
{
    [Fact]
    public void Create_WithValidData_CreatesAccountSuccessfully()
    {
        var account = Account.Create(
            "admin_user",
            "$2a$12$hashedPasswordExampleHere",
            "Nguyễn Văn A",
            "admin@smartinventory.com",
            AccountRole.QTV,
            "0912345678",
            new DateOnly(1990, 1, 1),
            "Hà Nội");

        Assert.Equal("admin_user", account.Username);
        Assert.Equal("Nguyễn Văn A", account.FullName);
        Assert.Equal("admin@smartinventory.com", account.Email);
        Assert.Equal(AccountRole.QTV, account.Role);
        Assert.Equal(AccountStatus.Active, account.Status);
        Assert.Equal("0912345678", account.PhoneNumber);
        Assert.Equal(new DateOnly(1990, 1, 1), account.DateOfBirth);
        Assert.Equal("Hà Nội", account.Address);
        Assert.Null(account.UpdatedAt);
    }

    [Theory]
    [InlineData("", "hash", "Name", "email@test.com")]
    [InlineData("user", "", "Name", "email@test.com")]
    [InlineData("user", "hash", "", "email@test.com")]
    [InlineData("user", "hash", "Name", "")]
    public void Create_WithInvalidRequiredFields_ThrowsDomainException(
        string username, string hash, string name, string email)
    {
        Assert.Throws<DomainException>(() =>
            Account.Create(username, hash, name, email, AccountRole.NhanVienKho));
    }

    [Fact]
    public void ChangeStatus_WhenStatusUnchanged_ThrowsDomainException()
    {
        var account = Account.Create("user1", "hash", "User One", "user1@test.com", AccountRole.NhanVienKho);

        Assert.Throws<DomainException>(() =>
            account.ChangeStatus(AccountStatus.Active, currentUserId: 999, activeAdminCount: 5));
    }

    [Fact]
    public void ChangeStatus_WhenQtvSelfLocks_ThrowsDomainException()
    {
        var account = Account.Create("qtv_user", "hash", "Admin", "admin@test.com", AccountRole.QTV);
        // Using reflection to set Id for unit test simulation
        typeof(Account).GetProperty("Id")!.SetValue(account, 10);

        var exception = Assert.Throws<DomainException>(() =>
            account.ChangeStatus(AccountStatus.Locked, currentUserId: 10, activeAdminCount: 2));

        Assert.Contains("không được phép tự khóa", exception.Message);
    }

    [Fact]
    public void ChangeStatus_WhenLockingLastActiveAdmin_ThrowsDomainException()
    {
        var account = Account.Create("qtv_user", "hash", "Admin", "admin@test.com", AccountRole.QTV);
        typeof(Account).GetProperty("Id")!.SetValue(account, 10);

        var exception = Assert.Throws<DomainException>(() =>
            account.ChangeStatus(AccountStatus.Locked, currentUserId: 99, activeAdminCount: 1));

        Assert.Contains("cuối cùng", exception.Message);
    }

    [Fact]
    public void UpdateProfile_WhenDemotingLastActiveAdmin_ThrowsDomainException()
    {
        var account = Account.Create("qtv_user", "hash", "Admin", "admin@test.com", AccountRole.QTV);
        typeof(Account).GetProperty("Id")!.SetValue(account, 10);

        var exception = Assert.Throws<DomainException>(() =>
            account.UpdateProfile("Admin Mới", "admin@test.com", null, null, null, AccountRole.QuanLyKho, currentUserId: 99, activeAdminCount: 1));

        Assert.Contains("cuối cùng", exception.Message);
    }

    [Fact]
    public void UpdateProfile_WhenAdminSelfDemotes_ThrowsDomainException()
    {
        var account = Account.Create("qtv_user", "hash", "Admin", "admin@test.com", AccountRole.QTV);
        typeof(Account).GetProperty("Id")!.SetValue(account, 10);

        var exception = Assert.Throws<DomainException>(() =>
            account.UpdateProfile("Admin", "admin@test.com", null, null, null, AccountRole.QuanLyKho, currentUserId: 10, activeAdminCount: 2));

        Assert.Contains("tự hạ vai trò", exception.Message);
    }

    [Fact]
    public void ChangePassword_WithValidHash_UpdatesPasswordAndTimestamp()
    {
        var account = Account.Create("user1", "oldHash", "Name", "email@test.com", AccountRole.NhanVienKho);
        var oldUpdatedAt = account.UpdatedAt;

        account.ChangePassword("newHashedPassword123");

        Assert.Equal("newHashedPassword123", account.PasswordHash);
        Assert.NotNull(account.UpdatedAt);
        Assert.NotEqual(oldUpdatedAt, account.UpdatedAt);
    }
}
