import json
from urllib.request import Request, urlopen
from app.core.config import settings
from app.core.utils import retry_on_failure

GRAPH = "https://graph.facebook.com/v20.0"

@retry_on_failure(max_retries=2)
def _http_json(url: str, headers: dict) -> dict:
    req = Request(url, headers=headers, method="GET")
    with urlopen(req, timeout=10) as r:
        return json.loads(r.read().decode("utf-8"))

@retry_on_failure(max_retries=2)
def _http_bytes(url: str, headers: dict) -> bytes:
    req = Request(url, headers=headers, method="GET")
    with urlopen(req, timeout=20) as r:
        return r.read()

def download_media_bytes(media_id: str) -> bytes:
    if not settings.wa_access_token:
        raise RuntimeError("WA_ACCESS_TOKEN es requerido para descargar media")
    headers = {"Authorization": f"Bearer {settings.wa_access_token}"}
    meta = _http_json(f"{GRAPH}/{media_id}", headers=headers)
    media_url = meta.get("url")
    if not media_url:
        raise RuntimeError("No se obtuvo url del media")
    return _http_bytes(media_url, headers=headers)

def iter_messages(payload: dict):
    if not isinstance(payload, dict):
        return
    for entry in payload.get("entry", []) or []:
        for change in entry.get("changes", []) or []:
            value = (change.get("value") or {})
            for msg in value.get("messages", []) or []:
                yield msg, value

@retry_on_failure(max_retries=1)
def send_message(to: str, text: str):
    if not settings.wa_access_token or not settings.wa_phone_number_id:
        return
    url = f"{GRAPH}/{settings.wa_phone_number_id}/messages"
    headers = {
        "Authorization": f"Bearer {settings.wa_access_token}",
        "Content-Type": "application/json"
    }
    payload = {
        "messaging_product": "whatsapp",
        "to": to,
        "type": "text",
        "text": {"body": text}
    }
    data = json.dumps(payload).encode("utf-8")
    req = Request(url, data=data, headers=headers, method="POST")
    try:
        with urlopen(req, timeout=10) as r:
            return json.loads(r.read().decode("utf-8"))
    except Exception as e:
        print(f"Error enviando mensaje WhatsApp: {str(e)}")
        return None
