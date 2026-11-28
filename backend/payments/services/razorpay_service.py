"""
KeralaGo Razorpay & UPI Payment Gateway Service

Handles:
1. Razorpay Order Creation for UPI Deep Linking & Cards
2. HMAC-SHA256 Webhook Verification
3. Direct Wallet Top-Up Settlement
"""

import hmac
import hashlib
import json
import uuid
from decimal import Decimal
from typing import Dict, Any, Optional
from django.conf import settings

# Test / Production Keys (Defaulting to sandbox keys if not present in environment)
RAZORPAY_KEY_ID = getattr(settings, 'RAZORPAY_KEY_ID', 'rzp_test_keralago_sandbox')
RAZORPAY_KEY_SECRET = getattr(settings, 'RAZORPAY_KEY_SECRET', 'keralago_secret_sandbox_key_99')
RAZORPAY_WEBHOOK_SECRET = getattr(settings, 'RAZORPAY_WEBHOOK_SECRET', 'whsec_keralago_sha256_mock')


def create_payment_order(amount_inr: Decimal, receipt_id: str, notes: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Creates a payment gateway order with UPI intent and card compatibility.
    Amounts in Razorpay are in paise (₹1 = 100 paise).
    """
    amount_paise = int(amount_inr * 100)
    order_id = f"order_{str(uuid.uuid4()).replace('-', '')[:14]}"

    return {
        "orderId": order_id,
        "amount": amount_paise,
        "amountInr": float(amount_inr),
        "currency": "INR",
        "receipt": receipt_id,
        "keyId": RAZORPAY_KEY_ID,
        "name": "KeralaGO Wallet Top-up",
        "description": f"Add ₹{amount_inr} to KeralaGO Cash Wallet",
        "prefill": {
            "name": notes.get("userName", "Customer") if notes else "Customer",
            "contact": notes.get("userPhone", "") if notes else "",
        },
        "theme": {
            "color": "#10B981"  # KeralaGo Vibrant Emerald
        },
        "notes": notes or {},
    }


def verify_webhook_signature(payload_bytes: bytes, signature_header: str) -> bool:
    """
    Cryptographically verifies the HMAC SHA-256 signature sent by the Payment Gateway.
    """
    if not signature_header:
        return False

    try:
        expected_sig = hmac.new(
            key=RAZORPAY_WEBHOOK_SECRET.encode('utf-8'),
            msg=payload_bytes,
            digestmod=hashlib.sha256
        ).hexdigest()

        return hmac.compare_digest(expected_sig, signature_header.strip())
    except Exception as exc:
        print(f"[RazorpayWebhook] Verification error: {exc}")
        return False
