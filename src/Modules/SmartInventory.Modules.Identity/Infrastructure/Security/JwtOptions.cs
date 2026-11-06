namespace SmartInventory.Modules.Identity.Infrastructure.Security;

public class JwtOptions
{
    public const string SectionName = "Jwt";

    public string Issuer { get; set; } = string.Empty;

    public string Audience { get; set; } = string.Empty;

    public string SigningKey { get; set; } = string.Empty;

    public int ExpiresMinutes { get; set; } = 60;

    public void Validate()
    {
        if (string.IsNullOrWhiteSpace(Issuer))
        {
            throw new InvalidOperationException("Cấu hình JWT thiếu 'Jwt:Issuer'.");
        }

        if (string.IsNullOrWhiteSpace(Audience))
        {
            throw new InvalidOperationException("Cấu hình JWT thiếu 'Jwt:Audience'.");
        }

        if (string.IsNullOrWhiteSpace(SigningKey))
        {
            throw new InvalidOperationException("Cấu hình JWT thiếu 'Jwt:SigningKey' (cần thiết lập qua biến môi trường hoặc appsettings).");
        }

        if (SigningKey.Length < 32)
        {
            throw new InvalidOperationException($"Cấu hình 'Jwt:SigningKey' phải có độ dài tối thiểu 32 ký tự (hiện tại: {SigningKey.Length}).");
        }
    }
}
