# ADR-002: Tách riêng dịch vụ AI (AI Service)

## Trạng thái
Accepted

## Bối cảnh
- SmartInventory có tính năng dự báo nhu cầu (demand forecasting), đề xuất kế hoạch nhập hàng tối ưu và phát hiện bất thường dữ liệu.
- Hệ sinh thái AI/ML phổ biến và mạnh mẽ nhất hiện nay nằm ở Python (Pandas, Scikit-learn, PyTorch, Statsmodels,...).
- Chu kỳ chạy của các tác vụ AI có tính chất định kỳ (theo mốc thời gian, batch job hàng tuần, hoặc theo các `ModelRuns`), tiêu tốn nhiều tài nguyên tính toán (CPU/RAM).
- Quy mô hệ thống có tài nguyên máy chủ hạn chế (~50 người dùng). Nếu nhúng trực tiếp logic Python vào runtime của .NET hoặc ép huấn luyện mô hình trong tiến trình API backend sẽ tiềm ẩn nguy cơ làm nghẽn hoặc sập ứng dụng quản lý kho lõi.

## Quyết định
- Tách riêng toàn bộ thành phần AI thành một dịch vụ độc lập (`ai-service`), phát triển bằng **Python** (FastAPI).
- Dịch vụ AI giao tiếp với backend chính thông qua **REST API / HTTP**:
  - Module `Forecasting` trong backend chịu trách nhiệm trích xuất dữ liệu bán hàng lịch sử (`SalesHistory`), tồn kho, lead time và gửi yêu cầu sang AI Service.
  - AI Service thực thi tính toán, suy luận mô hình và trả về kết quả dự báo.
  - Module `Forecasting` nhận kết quả, lưu vào các bảng `ModelRuns`, `DemandForecasts`, `OrderRecommendations`, `Anomalies`.

## Hệ quả
- **Tích cực**:
  - Cách ly lỗi (Fault Isolation): Nếu AI Service gặp lỗi hoặc sập do quá tải tính toán, hệ thống kho và mua hàng lõi (`Inventory`, `Procurement`, `Catalog`) vẫn vận hành bình thường.
  - Độc lập công nghệ và vòng đời: Đội ngũ phát triển AI có thể nâng cấp thuật toán, cập nhật thư viện Python hoặc retraining model mà không cần build hay deploy lại backend .NET.
  - Tối ưu hóa tài nguyên: Có thể phân bổ tài nguyên riêng hoặc chạy AI Service trên máy/container có cấu hình phù hợp khi cần tính toán lớn.
- **Hạn chế / Thách thức**:
  - Cần xử lý các vấn đề giao tiếp mạng: timeout, retry policy và circuit breaker khi backend gọi sang AI Service.
  - Cần đồng bộ cấu trúc hợp đồng dữ liệu (API schema) giữa Python service và .NET backend.
