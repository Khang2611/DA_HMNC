# ADR-003: Xác thực bằng JWT Access Token ngắn hạn

## Trạng thái
Accepted

## Bối cảnh
- Hệ thống SmartInventory áp dụng kiến trúc Modular Monolith và phân quyền theo vai trò (`NhanVienKho`, `QuanLyKho`, `GiamDoc`, `QTV`).
- Lược đồ cơ sở dữ liệu gốc `db/baseline/001_SmartInventoryDB.sql` bảng `dbo.Accounts` hiện tại không có các cột hoặc bảng lưu trữ Refresh Token (chỉ bao gồm thông tin tài khoản và mật khẩu băm `PasswordHash`).
- Quy định dự án nghiêm cấm thay đổi schema cơ sở dữ liệu hoặc thêm migration tự động ngoài baseline.
- Cần cơ chế xác thực stateless, an toàn, hiệu năng cao cho REST API.

## Quyết định
- Sử dụng **JWT (JSON Web Token) Access Token** ký bằng thuật toán HMAC-SHA256 (`HmacSha256`) với khóa bí mật tối thiểu 32 ký tự (`Jwt:SigningKey`).
- Thời gian sống (expiry) của access token được cấu hình ngắn hạn (mặc định 60 phút qua `Jwt:ExpiresMinutes`).
- **Không triển khai Refresh Token** ở bước này do không sửa schema DB.
- Token chỉ chứa các claims cần thiết cho nhận diện và phân quyền:
  - `sub`: định danh tài khoản (`Id`)
  - `unique_name`: tên đăng nhập (`Username`)
  - `role`: vai trò người dùng (`Role`)
  - `jti`: mã ngẫu nhiên cho mỗi token
- Tuyệt đối không đưa thông tin nhạy cảm (mật khẩu, hash, quyền chi tiết nội bộ) vào payload JWT.

## Hệ quả
- **Tích cực**:
  - Stateless: API không cần query database để xác thực danh tính trên mỗi request, giảm tải cho SQL Server.
  - Tương thích cao: Dễ dàng tích hợp với frontend SPA, mobile client hoặc các bên thứ ba.
  - Tuân thủ ranh giới dữ liệu và bảo toàn nguyên trạng script baseline DB.
- **Rủi ro**:
  - Không thể lập tức thu hồi (revoke) token trước thời điểm hết hạn khi người dùng bị khóa hoặc đổi vai trò (chỉ bị chặn khi token hết hạn hoặc tài khoản thao tác qua các endpoint có kiểm tra trạng thái thời gian thực).
- **Hướng mở rộng**:
  - Trong tương lai, khi có sự phê duyệt bổ sung bảng `RefreshTokens` vào DB baseline hoặc tích hợp Redis làm Token Blacklist/Distributed Cache, hệ thống sẽ mở rộng luồng cấp phát Refresh Token và cơ chế chủ động thu hồi token tức thì.

