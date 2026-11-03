"""
Email Authentication and OTP Dispatch Service for KeralaGO.
Uses Django's send_mail over Gmail SMTP with branded HTML template.
"""

import logging
from django.core.mail import EmailMultiAlternatives
from django.conf import settings
from django.utils.html import strip_tags

logger = logging.getLogger(__name__)


def send_email_otp(recipient_email: str, otp_code: str, user_name: str = "Valued Traveler") -> dict:
    """
    Sends a beautifully formatted Kerala Forest green branded OTP email.
    """
    clean_email = recipient_email.strip().lower()
    subject = f"🔐 {otp_code} is your KeralaGO Login Code"
    from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', f"KeralaGO <{getattr(settings, 'EMAIL_HOST_USER', 'couplespaceofficial@gmail.com')}>")

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f0fdf4; margin: 0; padding: 24px; }}
        .container {{ max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(16, 185, 129, 0.12); border: 1px solid #d1fae5; }}
        .header {{ background: linear-gradient(135deg, #0f4a2b 0%, #166534 100%); padding: 32px 24px; text-align: center; color: white; }}
        .header h1 {{ margin: 0; font-size: 26px; font-weight: 800; letter-spacing: 0.5px; }}
        .header p {{ margin: 6px 0 0; font-size: 13px; opacity: 0.9; }}
        .content {{ padding: 32px 28px; text-align: center; color: #1f2937; }}
        .greeting {{ font-size: 16px; font-weight: 600; color: #111827; margin-bottom: 12px; }}
        .msg {{ font-size: 14px; color: #4b5563; line-height: 1.6; margin-bottom: 24px; }}
        .otp-box {{ background: #ecfdf5; border: 2px dashed #10b981; border-radius: 12px; padding: 18px 24px; display: inline-block; margin: 0 auto 24px; }}
        .otp-code {{ font-size: 36px; font-weight: 800; letter-spacing: 10px; color: #047857; font-family: monospace; }}
        .expiry-note {{ font-size: 12px; color: #6b7280; margin-top: 6px; }}
        .security-tip {{ background: #fefce8; border-left: 4px solid #eab308; padding: 12px 16px; text-align: left; font-size: 12px; color: #713f12; border-radius: 0 8px 8px 0; margin-top: 20px; }}
        .footer {{ background: #f9fafb; padding: 18px; text-align: center; font-size: 11px; color: #9ca3af; border-top: 1px solid #f3f4f6; }}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🌴 KeralaGO</h1>
          <p>God's Own Way to Travel • Fast, Clean, Reliable</p>
        </div>
        <div class="content">
          <div class="greeting">Namaskaram, {user_name}!</div>
          <p class="msg">You requested a verification code to access your KeralaGO account. Use the one-time code below to complete authentication:</p>
          <div class="otp-box">
            <div class="otp-code">{otp_code}</div>
            <div class="expiry-note">⏱ Valid for 10 minutes • Do not share with anyone</div>
          </div>
          <div class="security-tip">
            <strong>🔒 Security Notice:</strong> KeralaGO staff will never ask you for your OTP code or password via phone call or SMS.
          </div>
        </div>
        <div class="footer">
          © 2026 KeralaGO Mobility Services Pvt. Ltd. • Kochi, Kerala<br>
          If you did not request this code, you can safely ignore this email.
        </div>
      </div>
    </body>
    </html>
    """

    plain_content = (
        f"Namaskaram, {user_name}!\n\n"
        f"Your KeralaGO verification code is: {otp_code}\n"
        f"This code will expire in 10 minutes.\n\n"
        f"If you did not request this code, please ignore this email.\n\n"
        f"© 2026 KeralaGO Mobility Services"
    )

    try:
        msg = EmailMultiAlternatives(
            subject=subject,
            body=plain_content,
            from_email=from_email,
            to=[clean_email]
        )
        msg.attach_alternative(html_content, "text/html")
        msg.send(fail_silently=False)

        logger.info(f"[EMAIL AUTH] Successfully sent OTP code to {clean_email}")
        return {
            'success': True,
            'message': f"Verification code sent to {clean_email}",
            'email': clean_email
        }
    except Exception as e:
        logger.error(f"[EMAIL AUTH] Error sending email to {clean_email}: {str(e)}")
        # In case of local network blocks without external SMTP reachability, log gracefully
        return {
            'success': False,
            'message': f"Failed to send email verification: {str(e)}",
            'email': clean_email
        }
