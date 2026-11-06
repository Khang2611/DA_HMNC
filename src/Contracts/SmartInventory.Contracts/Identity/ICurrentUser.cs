namespace SmartInventory.Contracts.Identity;

public interface ICurrentUser
{
    int? UserId { get; }

    string? Role { get; }

    bool IsAuthenticated { get; }
}
