using SmartInventory.Modules.Identity.Domain;

namespace SmartInventory.Modules.Identity.Application.DTOs;

public record AccountDto(
    int Id,
    string Username,
    string FullName,
    string Email,
    string? PhoneNumber,
    DateOnly? DateOfBirth,
    string? Address,
    string Role,
    string Status,
    DateTime CreatedAt,
    DateTime? UpdatedAt)
{
    public static AccountDto FromEntity(Account account) => new(
        account.Id,
        account.Username,
        account.FullName,
        account.Email,
        account.PhoneNumber,
        account.DateOfBirth,
        account.Address,
        account.Role.ToString(),
        account.Status.ToString(),
        account.CreatedAt,
        account.UpdatedAt);
}
