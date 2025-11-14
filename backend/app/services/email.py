"""
Email service using SMTP (Gmail)
"""
import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.config import get_settings


async def send_otp_email(to_email: str, otp_code: str):
    """Send OTP code via email"""
    settings = get_settings()

    # Create message
    message = MIMEMultipart("alternative")
    message["Subject"] = f"[쇼핑몰] 이메일 인증번호: {otp_code}"
    message["From"] = settings.SMTP_FROM_EMAIL
    message["To"] = to_email

    # HTML email content
    html_content = f"""
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06); overflow: hidden;">

                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 40px 30px; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">이메일 인증</h1>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 50px 40px;">
                    <p style="margin: 0 0 30px; color: #333333; font-size: 16px; line-height: 1.6;">
                      안녕하세요!<br>
                      회원가입을 완료하기 위해 아래 인증번호를 입력해주세요.
                    </p>

                    <!-- OTP Code Box -->
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 3px; margin: 30px 0;">
                      <div style="background-color: #ffffff; border-radius: 10px; padding: 30px; text-align: center;">
                        <div style="color: #999999; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px;">인증번호</div>
                        <div style="color: #667eea; font-size: 42px; font-weight: 700; letter-spacing: 8px; font-family: 'Courier New', monospace;">{otp_code}</div>
                      </div>
                    </div>

                    <!-- Timer Warning -->
                    <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 16px 20px; border-radius: 8px; margin: 30px 0;">
                      <p style="margin: 0; color: #856404; font-size: 14px; line-height: 1.5;">
                        <strong>⏱ 유효시간:</strong> 이 인증번호는 발송 시점부터 <strong>5분간</strong> 유효합니다.
                      </p>
                    </div>

                    <p style="margin: 30px 0 0; color: #666666; font-size: 14px; line-height: 1.6;">
                      본인이 요청하지 않은 경우, 이 이메일을 무시하셔도 됩니다.<br>
                      문의사항이 있으시면 고객센터로 연락주세요.
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #f8f9fa; padding: 30px 40px; text-align: center; border-top: 1px solid #e9ecef;">
                    <p style="margin: 0; color: #999999; font-size: 13px; line-height: 1.6;">
                      © 2024 쇼핑몰. All rights reserved.<br>
                      이 이메일은 발신 전용입니다.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
    """

    # Attach HTML content
    html_part = MIMEText(html_content, "html")
    message.attach(html_part)

    # Send email
    try:
        await aiosmtplib.send(
            message,
            hostname=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            username=settings.SMTP_USER,
            password=settings.SMTP_PASSWORD,
            start_tls=True,
            validate_certs=False,  # SSL 인증서 검증 비활성화 -- 개발 환경용
        )
        print(f"[EMAIL] OTP 이메일 전송 성공: {to_email}")
        return True
    except Exception as e:
        print(f"[ERROR] 이메일 전송 실패: {str(e)}")
        raise e