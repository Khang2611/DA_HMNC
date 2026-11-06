namespace SmartInventory.Contracts.Identity;

public static class Policies
{
    public const string RequireAdmin = "RequireAdmin";
    public const string RequireWarehouseManager = "RequireWarehouseManager";
    public const string RequireAuthenticated = "RequireAuthenticated";
}
