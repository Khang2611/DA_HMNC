# ADR-001: Lựa chọn kiến trúc Modular Monolith cho SmartInventory

## Trạng thái
Accepted

## Bối cảnh
- Hệ thống SmartInventory phục vụ quy mô khoảng 50 người dùng nội bộ đồng thời (quản trị, thủ kho, nhân viên mua hàng, bộ phận quản lý).
- Nhóm phát triển có quy mô nhỏ (nhóm đồ án), nguồn lực máy chủ và tài nguyên hạ tầng có giới hạn.
- Cơ sở dữ liệu hiện tại là SQL Server tập trung (21 bảng).
- Nếu áp dụng Microservices ngay từ đầu sẽ gây overhead lớn về hạ tầng (k8s, service discovery, distributed tracing, network latency, distributed transaction/2PC/Saga). Ngược lại, nếu xây dựng Monolith truyền thống không phân tầng sẽ dễ dẫn tới "Big Ball of Mud", khó phân chia công việc trong nhóm và khó tách dịch vụ sau này.

## Quyết định
- Lựa chọn kiến trúc **Modular Monolith** triển khai trong một .NET solution duy nhất.
- Hệ thống chia thành 5 module nghiệp vụ độc lập: `Identity`, `Catalog`, `Inventory`, `Procurement`, `Forecasting`.
- Mỗi module sở hữu riêng các bảng nghiệp vụ tương ứng:
  - `Identity`: `Accounts`
  - `Catalog`: `Categories`, `Suppliers`, `Products`, `Warehouses`, `Zones`, `Locations`
  - `Inventory`: `Batches`, `InventoryBalances`, `InventoryTickets`, `InventoryTicketDetails`, `InventoryTransactions`
  - `Procurement`: `PurchaseOrders`, `PurchaseOrderDetails`, `GoodsReceipts`, `GoodsReceiptDetails`
  - `Forecasting`: `SalesHistory`, `ModelRuns`, `DemandForecasts`, `OrderRecommendations`, `RecommendationPurchaseOrders`, `Anomalies`
- Luật phụ thuộc:
  - `Api` đóng vai trò Host, đăng ký DI cho các module.
  - Các module chỉ phụ thuộc vào `SharedKernel` và `Contracts`.
  - Không có tham chiếu chéo giữa các module. Giao tiếp liên module bắt buộc qua các interface trong `Contracts`.
  - Luật phụ thuộc này được giám sát tự động bằng `ArchitectureTests` (NetArchTest.Rules).

## Hệ quả
- **Tích cực**:
  - Dễ triển khai và vận hành: Chỉ cần 1 tiến trình chạy duy nhất, tối ưu tài nguyên cho quy mô ~50 người dùng.
  - Phân chia công việc rõ ràng: Mỗi thành viên trong nhóm phụ trách một module, hạn chế xung đột git khi merge.
  - Ranh giới sạch sẽ: Dễ dàng tách một module (ví dụ `Forecasting`) thành service độc lập trong tương lai nếu nhu cầu scale tăng cao.
  - Đảm bảo tính toàn vẹn: Vẫn tận dụng được transaction nội bộ cho các thao tác cốt lõi (như cập nhật tồn kho và ghi sổ biến động).
- **Hạn chế / Thách thức**:
  - Đòi hỏi kỷ luật nghiêm ngặt: Các thành viên không được join trực tiếp bảng của module khác hoặc lén tham chiếu chéo.
