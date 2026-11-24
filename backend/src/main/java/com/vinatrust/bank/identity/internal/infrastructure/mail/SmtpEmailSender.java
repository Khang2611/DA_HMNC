package com.vinatrust.bank.identity.internal.infrastructure.mail;

import com.vinatrust.bank.identity.internal.application.port.EmailSender;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;

@Component
public class SmtpEmailSender implements EmailSender {

    private static final Logger log = LoggerFactory.getLogger(SmtpEmailSender.class);

    private final JavaMailSender mailSender;
    private final String fromEmail;

    public SmtpEmailSender(
            JavaMailSender mailSender,
            @Value("${app.mail.from:no-reply@vinatrust.vn}") String fromEmail
    ) {
        this.mailSender = mailSender;
        this.fromEmail = fromEmail;
    }

    @Override
    public void sendVerificationOtp(String toEmail, String fullName, String otpCode, int expirationMinutes) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(
                    message,
                    MimeMessageHelper.MULTIPART_MODE_MIXED_RELATED,
                    StandardCharsets.UTF_8.name()
            );

            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("[VinaTrust Bank] Mã OTP xác thực kích hoạt tài khoản");

            String htmlBody = buildHtmlOtpTemplate(fullName, otpCode, expirationMinutes);
            helper.setText(htmlBody, true);

            mailSender.send(message);
            log.info("Sent verification OTP email successfully to '{}'", toEmail);
        } catch (MessagingException | RuntimeException e) {
            log.error("Failed to send verification OTP email to '{}': {}", toEmail, e.getMessage(), e);
        }
    }

    private String buildHtmlOtpTemplate(String fullName, String otpCode, int expirationMinutes) {
        return """
            <!DOCTYPE html>
            <html lang="vi">
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f6f8; margin: 0; padding: 20px; }
                    .card { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.06); padding: 32px; border-top: 5px solid #0052cc; }
                    .logo { color: #0052cc; font-size: 24px; font-weight: bold; letter-spacing: -0.5px; margin-bottom: 24px; }
                    .title { font-size: 18px; color: #172b4d; font-weight: 600; margin-bottom: 12px; }
                    .content { font-size: 15px; color: #42526e; line-height: 1.6; margin-bottom: 24px; }
                    .otp-box { background: #f0f4ff; border: 1px dashed #0052cc; border-radius: 8px; text-align: center; padding: 16px; margin: 20px 0; }
                    .otp-code { font-size: 32px; font-weight: 800; color: #0052cc; letter-spacing: 8px; font-family: monospace; }
                    .notice { font-size: 13px; color: #6b778c; margin-top: 16px; }
                    .footer { font-size: 12px; color: #8993a4; text-align: center; margin-top: 32px; border-top: 1px solid #ebecf0; padding-top: 16px; }
                </style>
            </head>
            <body>
                <div class="card">
                    <div class="logo">VinaTrust Bank</div>
                    <div class="title">Xác thực kích hoạt tài khoản</div>
                    <div class="content">
                        Xin chào <strong>%s</strong>,<br><br>
                        Cảm ơn bạn đã đăng ký dịch vụ Ngân hàng số VinaTrust Bank. Để hoàn tất kích hoạt tài khoản và mở tài khoản thanh toán mặc định, vui lòng nhập mã OTP dưới đây:
                    </div>
                    <div class="otp-box">
                        <div class="otp-code">%s</div>
                    </div>
                    <div class="notice">
                        * Mã xác thực có hiệu lực trong vòng <strong>%d phút</strong>.<br>
                        * Tuyệt đối không chia sẻ mã này với bất kỳ ai (kể cả nhân viên VinaTrust Bank) để bảo mật tài khoản.
                    </div>
                    <div class="footer">
                        Email này được gửi tự động từ hệ thống VinaTrust Bank.<br>
                        © 2026 VinaTrust Bank. Tất cả các quyền được bảo lưu.
                    </div>
                </div>
            </body>
            </html>
            """.formatted(fullName != null ? fullName : "Quý khách", otpCode, expirationMinutes);
    }
}

