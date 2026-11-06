using SmartInventory.SharedKernel.Exceptions;

namespace SmartInventory.Modules.Identity.Domain;

public class Account
{
    private Account()
    {
        Username = string.Empty;
        PasswordHash = string.Empty;
        FullName = string.Empty;
        Email = string.Empty;
        RowVersion = [];
    }

    public int Id { get; private set; }

    public string Username { get; private set; }

    public string PasswordHash { get; private set; }

    public string FullName { get; private set; }

    public string Email { get; private set; }

    public string? PhoneNumber { get; private set; }

    public DateOnly? DateOfBirth { get; private set; }

    public string? Address { get; private set; }

    public AccountRole Role { get; private set; }

    public AccountStatus Status { get; private set; }

    public DateTime CreatedAt { get; private set; }

    public DateTime? UpdatedAt { get; private set; }

    public byte[] RowVersion { get; private set; }

    public static Account Create(
        string username,
        string passwordHash,
        string fullName,
        string email,
        AccountRole role,
        string? phoneNumber = null,
        DateOnly? dateOfBirth = null,
        string? address = null)
    {
        if (string.IsNullOrWhiteSpace(username))
        {
            throw new DomainException("Username không được để trống.");
        }

        if (string.IsNullOrWhiteSpace(passwordHash))
        {
            throw new DomainException("PasswordHash không được để trống.");
        }

        if (string.IsNullOrWhiteSpace(fullName))
        {
            throw new DomainException("FullName không được để trống.");
        }

        if (string.IsNullOrWhiteSpace(email))
        {
            throw new DomainException("Email không được để trống.");
        }

        return new Account
        {
            Username = username.Trim(),
            PasswordHash = passwordHash,
            FullName = fullName.Trim(),
            Email = email.Trim().ToLowerInvariant(),
            Role = role,
            Status = AccountStatus.Active,
            PhoneNumber = string.IsNullOrWhiteSpace(phoneNumber) ? null : phoneNumber.Trim(),
            DateOfBirth = dateOfBirth,
            Address = string.IsNullOrWhiteSpace(address) ? null : address.Trim(),
            CreatedAt = DateTime.UtcNow
        };
    }

    public void UpdateProfile(
        string fullName,
        string email,
        string? phoneNumber,
        DateOnly? dateOfBirth,
        string? address,
        AccountRole newRole,
        int currentUserId,
        int activeAdminCount)
    {
        if (string.IsNullOrWhiteSpace(fullName))
        {
            throw new DomainException("FullName không được để trống.");
        }

        if (string.IsNullOrWhiteSpace(email))
        {
            throw new DomainException("Email không được để trống.");
        }

        var normalizedEmail = email.Trim().ToLowerInvariant();
        var normalizedFullName = fullName.Trim();
        var normalizedPhone = string.IsNullOrWhiteSpace(phoneNumber) ? null : phoneNumber.Trim();
        var normalizedAddress = string.IsNullOrWhiteSpace(address) ? null : address.Trim();

        if (Role == AccountRole.QTV && newRole != AccountRole.QTV)
        {
            if (Status == AccountStatus.Active && activeAdminCount <= 1)
            {
                throw new DomainException("Không thể hạ vai trò của Quản trị viên (QTV) đang hoạt động cuối cùng trong hệ thống.");
            }

            if (Id == currentUserId)
            {
                throw new DomainException("Quản trị viên không thể tự hạ vai trò của chính mình.");
            }
        }

        var hasChanges = FullName != normalizedFullName ||
                         Email != normalizedEmail ||
                         PhoneNumber != normalizedPhone ||
                         DateOfBirth != dateOfBirth ||
                         Address != normalizedAddress ||
                         Role != newRole;

        if (!hasChanges)
        {
            return;
        }

        FullName = normalizedFullName;
        Email = normalizedEmail;
        PhoneNumber = normalizedPhone;
        DateOfBirth = dateOfBirth;
        Address = normalizedAddress;
        Role = newRole;
        UpdatedAt = DateTime.UtcNow;
    }

    public void ChangePassword(string newPasswordHash)
    {
        if (string.IsNullOrWhiteSpace(newPasswordHash))
        {
            throw new DomainException("PasswordHash mới không được để trống.");
        }

        PasswordHash = newPasswordHash;
        UpdatedAt = DateTime.UtcNow;
    }

    public void ChangeStatus(AccountStatus newStatus, int currentUserId, int activeAdminCount)
    {
        if (Status == newStatus)
        {
            throw new DomainException($"Tài khoản đã ở trạng thái {newStatus}.");
        }

        if (Id == currentUserId && newStatus != AccountStatus.Active)
        {
            throw new DomainException("Quản trị viên không được phép tự khóa hoặc vô hiệu hóa chính mình.");
        }

        if (Role == AccountRole.QTV && Status == AccountStatus.Active && newStatus != AccountStatus.Active && activeAdminCount <= 1)
        {
            throw new DomainException("Không thể khóa hoặc vô hiệu hóa Quản trị viên (QTV) đang hoạt động cuối cùng trong hệ thống.");
        }

        Status = newStatus;
        UpdatedAt = DateTime.UtcNow;
    }
}
