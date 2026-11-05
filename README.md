# SmartInventory

Hệ thống quản lý kho và đề xuất nhập hàng thông minh theo kiến trúc **Modular Monolith** trên nền tảng **.NET 10**.

## 1. Tổng quan & Cấu trúc dự án

Hệ thống phục vụ quy mô khoảng 50 người dùng nội bộ (quản trị viên, thủ kho, nhân viên mua hàng, quản lý), phân chia thành các ranh giới module độc lập dựa trên nghiệp vụ và tính nhất quán dữ liệu:

```text
DA_HMNC/
├─ src/
│  ├─ Host/
│  │  └─ SmartInventory.Api/                       # Host khởi chạy, tổng hợp DI các module, API endpoints
│  ├─ BuildingBlocks/
│  │  └─ SmartInventory.SharedKernel/              # Chứa primitives dùng chung, Domain Exceptions, ValidationBehavior
│  ├─ Contracts/
│  │  └─ SmartInventory.Contracts/                 # Interface public và DTO giao tiếp giữa các module
│  └─ Modules/
│     ├─ SmartInventory.Modules.Identity/          # Quản lý tài khoản (Accounts), JWT, phân quyền
│     ├─ SmartInventory.Modules.Catalog/           # Dữ liệu gốc: Categories, Suppliers, Products, Warehouses, Zones, Locations
│     ├─ SmartInventory.Modules.Inventory/         # Nghiệp vụ kho lõi: Batches, Balances, Tickets, Transactions
│     ├─ SmartInventory.Modules.Procurement/       # Mua hàng & nhập kho: PurchaseOrders, GoodsReceipts
│     └─ SmartInventory.Modules.Forecasting/       # Dự báo nhu cầu, đề xuất nhập hàng, tích hợp AI service
├─ tests/
│  ├─ SmartInventory.ArchitectureTests/            # Kiểm tra luật phụ thuộc ranh giới module (NetArchTest)
│  ├─ SmartInventory.Inventory.UnitTests/          # Unit tests kiểm thử hành vi nghiệp vụ
│  └─ SmartInventory.Api.IntegrationTests/        # Integration tests API (WebApplicationFactory)
├─ ai-service/                                     # Dịch vụ AI/ML độc lập (Python FastAPI)
├─ deploy/                                         # Docker compose, Nginx và cấu hình triển khai
└─ docs/                                           # Tài liệu kiến trúc (ADR, C4, UML)
```

## 2. Luật phụ thuộc (Architecture Dependency Rules)

- `Api` $\rightarrow$ Phụ thuộc vào tất cả các Module và `SharedKernel`.
- `Module` $\rightarrow$ Chỉ phụ thuộc vào `SharedKernel` và `Contracts`.
- **Tuyệt đối không tham chiếu trực tiếp giữa các module**. Mọi giao tiếp giữa module bắt buộc đi qua `Contracts`.
- Đọc quy chuẩn phát triển chi tiết tại [AGENTS.md](AGENTS.md).

## 3. Hướng dẫn Build & Test

### Yêu cầu môi trường
- .NET SDK 10.0+

### Lệnh chạy kiểm tra
```bash
# Khôi phục dependencies
dotnet restore

# Kiểm tra định dạng code
dotnet format --verify-no-changes

# Build toàn bộ solution (Release)
dotnet build -c Release

# Chạy toàn bộ test suites (Release)
dotnet test -c Release
```

## 4. Tài liệu kiến trúc (ADR)
- [ADR-001: Lựa chọn kiến trúc Modular Monolith](docs/adr/ADR-001-modular-monolith.md)
- [ADR-002: Tách riêng AI Service](docs/adr/ADR-002-tach-ai-service.md)
