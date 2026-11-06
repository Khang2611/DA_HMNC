namespace SmartInventory.Modules.Identity.Application.DTOs;

public record LoginResponse(
    string AccessToken,
    int ExpiresIn,
    AccountDto User);
