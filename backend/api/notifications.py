"""
KeralaGo Push Notification Service (Expo Push API)

Delivers real-time background and lock-screen push notifications to passengers and drivers.
Endpoint: https://exp.host/--/api/v2/push/send
"""

import json
import urllib.request
from typing import Optional, Dict, Any


EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"


def send_push_notification(
    push_token: Optional[str],
    title: str,
    body: str,
    data: Optional[Dict[str, Any]] = None,
    channel_id: str = "ride-updates",
    sound: str = "default"
) -> bool:
    """
    Sends a push notification to a device via Expo Push Notification Service.
    Silently fails in dev/offline mode without raising unhandled exceptions.
    """
    if not push_token or not push_token.strip():
        return False

    token = push_token.strip()
    # Expo tokens start with ExponentPushToken[...] or ExpoPushToken[...]
    if not (token.startswith("ExponentPushToken[") or token.startswith("ExpoPushToken[")):
        # Could be an FCM token or mock dev token
        return False

    payload = {
        "to": token,
        "title": title,
        "body": body,
        "sound": sound,
        "channelId": channel_id,
        "data": data or {},
    }

    try:
        req_data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            EXPO_PUSH_URL,
            data=req_data,
            headers={
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=2.5) as resp:
            return resp.status == 200
    except Exception as exc:
        # Logging only, never break transactional request loop
        print(f"[PushNotification] Notice: Failed to dispatch push to {token[:16]}...: {exc}")
        return False


def notify_user(user, title: str, body: str, data: Optional[Dict[str, Any]] = None) -> bool:
    """
    Convenience method to dispatch a push notification to any registered User instance.
    """
    if not user:
        return False

    profile = getattr(user, "profile", None)
    if profile and profile.push_token:
        return send_push_notification(profile.push_token, title, body, data)

    return False
