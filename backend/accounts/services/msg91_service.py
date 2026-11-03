"""
MSG91 Cloud Communication Integration Service for KeralaGO
Supports: SendOTP Widget API (v5) and direct OTP Verification.
Documentation reference: https://docs.msg91.com/otp/llms.txt
"""

import logging
import requests
from django.conf import settings

logger = logging.getLogger(__name__)

WIDGET_API_BASE = "https://api.msg91.com/api/v5/widget"
CONTROL_API_BASE = "https://control.msg91.com/api/v5/otp"


def clean_mobile_for_msg91(raw_phone: str) -> str:
    """
    MSG91 expects phone numbers in international format without '+' symbol.
    Example: '+91 98470 12345' -> '919847012345'
    """
    digits = ''.join(c for c in raw_phone if c.isdigit())
    if len(digits) == 10:
        return f"91{digits}"
    return digits


def is_msg91_configured() -> bool:
    """Returns True if MSG91_AUTH_KEY is provided in settings/env."""
    return bool(getattr(settings, 'MSG91_AUTH_KEY', None))


def send_msg91_otp(mobile: str, otp_code: str = None) -> dict:
    """
    Sends OTP using MSG91 SendOTP Widget API or direct API.
    Does NOT return fake success when MSG91 encounters an error.
    """
    authkey = getattr(settings, 'MSG91_AUTH_KEY', '').strip()
    widget_id = getattr(settings, 'MSG91_WIDGET_ID', '').strip()
    template_id = getattr(settings, 'MSG91_OTP_TEMPLATE_ID', '').strip()
    clean_mobile = clean_mobile_for_msg91(mobile)

    if not authkey:
        return {
            'success': False,
            'message': 'MSG91 AuthKey is not configured in backend/.env'
        }

    # 1. Try SendOTP Widget API if widget_id is configured
    if widget_id:
        url = f"{WIDGET_API_BASE}/sendOtp"
        payload = {
            'widgetId': widget_id,
            'tokenAuth': authkey,
            'identifier': clean_mobile,
        }
        headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
        try:
            # 5s connect timeout, 20s read timeout to accommodate telecom DLT network queueing
            res = requests.post(url, json=payload, headers=headers, timeout=(5, 20))
            data = res.json() if res.headers.get('content-type', '').startswith('application/json') else {}
            
            # Check for Captcha or configuration error from MSG91
            if data.get('hasError') or data.get('type') == 'error' or data.get('status') == 'fail':
                err_msg = data.get('message', 'MSG91 Widget rejected the request')
                if 'captcha' in err_msg.lower():
                    friendly_error = (
                        "MSG91 Error: 'Invalid Captcha Token'. "
                        "Please open MSG91 Dashboard (control.msg91.com) -> OTP -> Widgets -> Edit your widget, "
                        "and set 'Captcha' to 'Disabled' to allow mobile API SMS delivery."
                    )
                else:
                    friendly_error = f"MSG91 Widget Error: {err_msg}"
                logger.error(f"[MSG91] Widget sendOtp error: {err_msg}")
                return {
                    'success': False,
                    'message': friendly_error,
                    'raw': data
                }

            if res.status_code == 200:
                req_id = data.get('reqId') or data.get('request_id') or data.get('message')
                return {
                    'success': True,
                    'request_id': req_id,
                    'message': f"OTP sent via MSG91 to +{clean_mobile}",
                    'raw': data
                }
        except requests.exceptions.Timeout:
            logger.error(f"[MSG91 Widget] Read timed out contacting MSG91 for +{clean_mobile}")
            return {
                'success': False,
                'message': "MSG91 SMS Gateway timed out. Indian telecom DLT routing may be experiencing high latency. Please retry in a few seconds or use Email OTP."
            }
        except Exception as e:
            logger.error(f"[MSG91 Widget] Connection error: {str(e)}")
            return {
                'success': False,
                'message': f"Failed to connect to MSG91 Widget service: {str(e)}"
            }

    # 2. Direct MSG91 OTP API fallback (requires approved template_id)
    url = CONTROL_API_BASE
    params = {
        'mobile': clean_mobile,
        'otp_length': 4,
        'otp_expiry': 10,
    }
    if template_id:
        params['template_id'] = template_id
    if otp_code:
        params['otp'] = otp_code

    headers = {
        'authkey': authkey,
        'Accept': 'application/json'
    }

    try:
        response = requests.post(url, params=params, headers=headers, timeout=10)
        data = response.json() if response.headers.get('content-type', '').startswith('application/json') else {}

        if response.status_code == 200 and data.get('type') != 'error':
            return {
                'success': True,
                'request_id': data.get('request_id'),
                'message': f"OTP dispatched via MSG91 to +{clean_mobile}"
            }
        else:
            error_msg = data.get('message', f"HTTP {response.status_code}")
            return {
                'success': False,
                'message': f"MSG91 Error: {error_msg}"
            }
    except Exception as e:
        return {
            'success': False,
            'message': f"MSG91 Gateway unreachable: {str(e)}"
        }


def verify_msg91_otp(mobile: str, otp: str, req_id: str = None) -> dict:
    """
    Verifies user OTP against MSG91 Widget verification gateway.
    POST https://api.msg91.com/api/v5/widget/verifyOtp
    """
    authkey = getattr(settings, 'MSG91_AUTH_KEY', '').strip()
    widget_id = getattr(settings, 'MSG91_WIDGET_ID', '').strip()
    clean_mobile = clean_mobile_for_msg91(mobile)

    if not authkey:
        return {'success': False, 'message': 'MSG91 AuthKey not configured.'}

    # 1. Widget verification (used when MSG91 SendOTP widget is active)
    if widget_id and req_id:
        url = f"{WIDGET_API_BASE}/verifyOtp"
        payload = {
            'widgetId': widget_id,
            'tokenAuth': authkey,
            'otp': str(otp).strip(),
            'reqId': str(req_id).strip(),
        }
        headers = {
            'authkey': authkey,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        }
        try:
            res = requests.post(url, json=payload, headers=headers, timeout=(5, 15))
            data = res.json() if res.headers.get('content-type', '').startswith('application/json') else {}
            logger.info(f"[MSG91 Widget verify] status={res.status_code}, data={data}")
            if res.status_code == 200 and (data.get('type') == 'success' or data.get('status') == 'success'):
                return {'success': True, 'message': 'OTP verified successfully via MSG91 Widget.'}
            err_msg = data.get('message', 'Invalid OTP code.')
            return {'success': False, 'message': err_msg}
        except Exception as e:
            logger.warning(f"[MSG91] Widget verify failed: {e}")
            return {'success': False, 'message': f"MSG91 widget verify connection error: {str(e)}"}

    # 2. Control verify (used for direct MSG91 OTP API without SendOTP widget)
    url = f"{CONTROL_API_BASE}/verify"
    params = {'mobile': clean_mobile, 'otp': str(otp).strip()}
    headers = {'authkey': authkey, 'Accept': 'application/json'}

    try:
        response = requests.get(url, params=params, headers=headers, timeout=(5, 15))
        data = response.json() if response.headers.get('content-type', '').startswith('application/json') else {}
        if response.status_code == 200 and data.get('type') == 'success':
            return {'success': True, 'message': 'OTP verified successfully via MSG91.'}
        return {'success': False, 'message': data.get('message', 'Invalid OTP code.')}
    except Exception as e:
        return {'success': False, 'message': f"MSG91 verification service unreachable: {str(e)}"}
