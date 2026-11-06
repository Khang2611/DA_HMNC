using System.Reflection;
using NetArchTest.Rules;
using SmartInventory.Contracts;
using SmartInventory.Modules.Catalog;
using SmartInventory.Modules.Forecasting;
using SmartInventory.Modules.Identity;
using SmartInventory.Modules.Inventory;
using SmartInventory.Modules.Procurement;
using SmartInventory.SharedKernel.Exceptions;

namespace SmartInventory.ArchitectureTests;

public class ModuleArchitectureTests
{
    private static readonly (string ModuleName, Assembly Assembly, string Namespace)[] Modules =
    [
        ("Identity", typeof(IdentityModule).Assembly, "SmartInventory.Modules.Identity"),
        ("Catalog", typeof(CatalogModule).Assembly, "SmartInventory.Modules.Catalog"),
        ("Inventory", typeof(InventoryModule).Assembly, "SmartInventory.Modules.Inventory"),
        ("Procurement", typeof(ProcurementModule).Assembly, "SmartInventory.Modules.Procurement"),
        ("Forecasting", typeof(ForecastingModule).Assembly, "SmartInventory.Modules.Forecasting"),
    ];

    [Theory]
    [InlineData("Identity")]
    [InlineData("Catalog")]
    [InlineData("Inventory")]
    [InlineData("Procurement")]
    [InlineData("Forecasting")]
    public void Module_ShouldNotDependOn_OtherModules(string moduleName)
    {
        var current = Modules.First(m => m.ModuleName == moduleName);
        var otherModuleNamespaces = Modules
            .Where(m => m.ModuleName != moduleName)
            .Select(m => m.Namespace)
            .ToArray();

        var result = Types.InAssembly(current.Assembly)
            .ShouldNot()
            .HaveDependencyOnAny(otherModuleNamespaces)
            .GetResult();

        var failingTypes = result.FailingTypeNames != null
            ? string.Join(", ", result.FailingTypeNames)
            : "none";

        Assert.True(
            result.IsSuccessful,
            $"Module '{moduleName}' vi phạm luật kiến trúc: phụ thuộc vào module khác. Các kiểu vi phạm: {failingTypes}");
    }

    [Fact]
    public void SharedKernel_ShouldNotDependOn_Modules()
    {
        var sharedKernelAssembly = typeof(DomainException).Assembly;

        var result = Types.InAssembly(sharedKernelAssembly)
            .ShouldNot()
            .HaveDependencyOn("SmartInventory.Modules")
            .GetResult();

        var failingTypes = result.FailingTypeNames != null
            ? string.Join(", ", result.FailingTypeNames)
            : "none";

        Assert.True(
            result.IsSuccessful,
            $"SharedKernel vi phạm luật kiến trúc: phụ thuộc vào SmartInventory.Modules. Các kiểu vi phạm: {failingTypes}");
    }

    [Fact]
    public void Contracts_ShouldNotDependOn_Modules()
    {
        var contractsAssembly = typeof(IContractsMarker).Assembly;

        var result = Types.InAssembly(contractsAssembly)
            .ShouldNot()
            .HaveDependencyOn("SmartInventory.Modules")
            .GetResult();

        var failingTypes = result.FailingTypeNames != null
            ? string.Join(", ", result.FailingTypeNames)
            : "none";

        Assert.True(
            result.IsSuccessful,
            $"Contracts vi phạm luật kiến trúc: phụ thuộc vào SmartInventory.Modules. Các kiểu vi phạm: {failingTypes}");
    }
}
