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
    <html>
      <body style="font-family: Arial, sans-serif; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 30px; border-radius: 10px;">
          <h2 style="color: #333;">이메일 인증번호</h2>
          <p style="color: #666; font-size: 16px;">회원가입을 위한 인증번호입니다.</p>
          <div style="background-color: #fff; padding: 20px; border-radius: 5px; text-align: center; margin: 20px 0;">
            <h1 style="color: #4CAF50; font-size: 36px; letter-spacing: 5px; margin: 0;">{otp_code}</h1>
          </div>
          <p style="color: #999; font-size: 14px;">이 인증번호는 5분간 유효합니다.</p>
          <p style="color: #999; font-size: 14px;">본인이 요청하지 않았다면 이 이메일을 무시하세요.</p>
        </div>
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
        )
        print(f"[EMAIL] OTP 이메일 전송 성공: {to_email}")
        return True
    except Exception as e:
        print(f"[ERROR] 이메일 전송 실패: {str(e)}")
        raise e