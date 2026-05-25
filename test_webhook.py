"""
Script de prueba end-to-end para PayLens.
Ejecutar: .venv\\Scripts\\python.exe test_webhook.py
"""
import json
import hmac
import hashlib
import urllib.request
import urllib.error

BASE = "http://localhost:8080/api"
SECRET = "351a26800e43a4edc6a0c60c0ea15780"

def sign(body: bytes) -> str:
    mac = hmac.new(SECRET.encode(), body, hashlib.sha256).hexdigest()
    return f"sha256={mac}"

def post(path, payload):
    body = json.dumps(payload).encode()
    req = urllib.request.Request(
        f"{BASE}{path}",
        data=body,
        headers={
            "Content-Type": "application/json",
            "X-Hub-Signature-256": sign(body),
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.status, json.loads(r.read())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode())

def get(path):
    req = urllib.request.Request(f"{BASE}{path}", method="GET")
    with urllib.request.urlopen(req, timeout=10) as r:
        return json.loads(r.read())

print("=" * 50)
print("1. Health check...")
h = get("/health")
print(f"   Supabase: {h.get('supabase')} | App OK: {h.get('ok')}")
if h.get('supabase') == 'down':
    print(f"   Error Supabase: {h.get('error')}")

print("\n2. Test webhook - mensaje de texto...")
status, resp = post("/whatsapp", {
    "object": "whatsapp_business_account",
    "entry": [{"changes": [{"value": {"messages": [
        {"from": "573001234567", "id": "wamid.test" + str(hash("text")), "type": "text",
         "text": {"body": "hola"}}
    ]}}]}]
})
print(f"   HTTP {status}: {json.dumps(resp, indent=2)}")

print("\n3. Test webhook - imagen (sin bytes, OCR vacío)...")
status2, resp2 = post("/whatsapp", {
    "object": "whatsapp_business_account",
    "entry": [{"changes": [{"value": {"messages": [
        {"from": "573001234567", "id": "wamid.test" + str(hash("image")), "type": "image",
         "image": {"id": "media_id_test_001", "mime_type": "image/jpeg"}}
    ]}}]}]
})
print(f"   HTTP {status2}: {json.dumps(resp2, indent=2)}")

print("\nTests completados")
