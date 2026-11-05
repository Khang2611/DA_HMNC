# AGENTS.md - Quy tắc phát triển hệ thống SmartInventory

Tài liệu này định nghĩa các nguyên tắc bắt buộc cho mọi kỹ sư và tác nhân AI khi tham gia phát triển dự án SmartInventory.

---

## 1. Kiến trúc hệ thống và Luật phụ thuộc (Architecture & Dependency Rules)
- Dự án áp dụng kiến trúc **Modular Monolith** gồm 5 module nghiệp vụ: `Identity`, `Catalog`, `Inventory`, `Procurement`, `Forecasting`.
- **Luật phụ thuộc nghiêm ngặt**:
  - `SmartInventory.Api` $\rightarrow$ Phụ thuộc vào tất cả các Module và `SharedKernel` để bootstrap cấu hình DI.
  - `SmartInventory.Modules.*` $\rightarrow$ Chỉ được phụ thuộc vào `SharedKernel` và `Contracts`.
  - **Module KHÔNG được phép tham chiếu trực tiếp đến module khác**. Mọi giao tiếp giữa các module bắt buộc phải thông qua interface công khai định nghĩa trong `SmartInventory.Contracts` hoặc messaging.
  - Code của module này tuyệt đối không được đọc/ghi trực tiếp vào DbContext/bảng dữ liệu của module khác.

---

## 2. Cấu trúc Use Case (CQRS Pattern)
- Mỗi use case phải được tổ chức độc lập gồm bộ 3 thành phần:
  1. **Command** hoặc **Query** (triển khai `IRequest<TResponse>` qua MediatR).
  2. **Handler** (triển khai `IRequestHandler<TRequest, TResponse>`).
  3. **Validator** (triển khai `AbstractValidator<TRequest>` qua FluentValidation).

---

## 3. Đóng gói Aggregate Root (Encapsulation)
- Thay đổi trạng thái thực thể (Entity/Aggregate) chỉ được thực hiện thông qua các public method có ý nghĩa nghiệp vụ của Aggregate Root.
- Không để public setter cho các property trên Aggregate Root / Entity nhằm đảm bảo tính toàn vẹn và bất biến của domain rules.

---

## 4. Tính nhất quán trong quản lý tồn kho (Inventory Consistency)
- Mọi thao tác làm thay đổi số lượng tồn kho (nhập kho, xuất kho, điều chuyển, điều chỉnh cân bằng trong `Batches` và `InventoryBalances`) **bắt buộc phải nằm trong cùng một Database Transaction** với việc ghi nhận dòng biến động sổ cái `InventoryTransactions` (bao gồm `BalanceAfter`).

---

## 5. Quản lý thư viện và phụ thuộc bên thứ ba (Third-party Dependencies)
- Tuyệt đối không tự ý cài đặt thêm thư viện NuGet hoặc bên thứ ba khi chưa có Architecture Decision Record (ADR) được thảo luận và phê duyệt.
- MediatR bắt buộc giữ ở phiên bản 12.x (không nâng cấp lên 13+ vì thay đổi mô hình giấy phép).

---

## 6. Bảo mật và Cấu hình (Secrets & Configurations)
- Tuyệt đối không commit bí mật, API key, mật khẩu, connection string vào mã nguồn hay git repository.
- Toàn bộ cấu hình nhạy cảm phải được truyền qua biến môi trường (Environment Variables) hoặc cấu hình ngoài an toàn.

---

## 7. Quản lý lược đồ Database (Database Schema Management)
- Mọi thay đổi schema cơ sở dữ liệu phải được xem xét và phê duyệt trước bởi tech lead / DBA.
- Cơ sở dữ liệu nguồn gốc được định nghĩa tại `db/baseline/001_SmartInventoryDB.sql` (KHÔNG sửa trực tiếp file này).
- Tuyệt đối không sử dụng `EnsureCreated()` hoặc công cụ tự động migration của ORM để tự ý tạo hoặc đè bảng lên database thực tế.

---

## 8. Chuẩn hóa lỗi API (Problem Details RFC 7807)
- Tất cả các endpoint API khi gặp lỗi phải trả về định dạng chuẩn **Problem Details (RFC 7807)**:
  - Lỗi validate dữ liệu: `400 Bad Request` (kèm chi tiết lỗi theo từng trường trong `extensions.errors`).
  - Lỗi không tìm thấy tài nguyên: `404 Not Found`.
  - Lỗi xung đột dữ liệu: `409 Conflict`.
  - Lỗi vi phạm quy tắc domain: `422 Unprocessable Entity`.
  - Lỗi hệ thống chưa bắt: `500 Internal Server Error` (ẩn thông tin chi tiết nhạy cảm ngoài môi trường Development).

---

## 9. Tiêu chuẩn kiểm thử và định dạng mã nguồn (Verification Standards)
- Trước khi báo cáo hoàn thành bất kỳ tác vụ nào hoặc tạo Pull Request, bắt buộc phải chạy và đảm bảo thành công 100% không có cảnh báo:
  - `dotnet format --verify-no-changes`
  - `dotnet build`
  - `dotnet test`

---

## 10. Minh bạch đóng góp của AI (AI-Assisted Transparency)
- Mọi Pull Request hoặc commit có sự đóng góp hay sinh mã từ công cụ AI bắt buộc phải ghi rõ nhãn/mô tả `"AI-assisted"`.
