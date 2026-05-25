import json
import time
import hmac
import hashlib
import urllib.request
import urllib.error
from datetime import datetime

BASE = "http://localhost:8000"
SECRET = "351a26800e43a4edc6a0c60c0ea15780"

def sign(body: bytes) -> str:
    mac = hmac.new(SECRET.encode(), body, hashlib.sha256).hexdigest()
    return f"sha256={mac}"

def call_api(method, path, payload=None):
    url = f"{BASE}{path}"
    data = json.dumps(payload).encode() if payload else None
    headers = {"Content-Type": "application/json"}
    if method == "POST" and data:
        headers["X-Hub-Signature-256"] = sign(data)
    
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    start = time.time()
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            end = time.time()
            return r.status, json.loads(r.read()), (end - start)
    except urllib.error.HTTPError as e:
        end = time.time()
        try:
            return e.code, json.loads(e.read().decode()), (end - start)
        except:
            return e.code, {"error": e.reason}, (end - start)

def run_audit():
    print("🚀 INICIANDO AUDITORÍA DE CALIDAD PAYLENS ELITE...")
    print("=" * 60)
    
    report = {
        "timestamp": datetime.now().isoformat(),
        "tests": []
    }

    # Test 1: Health & Connectivity
    print("\n[TEST 1] Verificando Salud del Sistema y Supabase...")
    # Pequeño reintento para esperar a que el server suba
    for i in range(5):
        try:
            status, resp, lat = call_api("GET", "/api/health")
            break
        except Exception:
            if i == 4: raise
            time.sleep(2)

    db_ok = resp.get("supabase") == "up"
    print(f"   Status: {'✅ OK' if db_ok else '❌ DOWN'} | Latencia: {lat:.3f}s")
    report["tests"].append({"name": "Health Check", "ok": db_ok, "latency": lat})

    # Test 2: Simulación de Notificación Bancaria (Source of Truth)
    print("\n[TEST 2] Inyectando Notificación Bancaria (Relay)...")
    payload_bank = {
        "bank": "Nequi",
        "amount": 50000,
        "reference": "AUDIT" + str(int(time.time())),
        "payment_date": datetime.now().isoformat()
    }
    # Verificamos si bank-notification es GET o POST (algunas veces se usa GET con query params en legacy)
    status, resp, lat = call_api("POST", "/api/bank-notification", payload_bank) 
    print(f"   Status: {'✅ RECIBIDO' if status == 200 else f'❌ ERROR ({status})'} | Res: {resp}")
    report["tests"].append({"name": "Bank Notification Injection", "ok": status == 200, "latency": lat})

    # Test 3: E2E Flow - Validación de Comprobante
    print("\n[TEST 3] Procesando Comprobante E2E (WhatsApp Webhook)...")
    payload_wa = {
        "object": "whatsapp_business_account",
        "entry": [{"changes": [{"value": {"messages": [
            {
                "from": "573004567890", 
                "id": "wamid.audit." + str(int(time.time())), 
                "type": "image",
                "image": {"id": "audit_media_001", "mime_type": "image/jpeg"}
            }
        ]}}]}]
    }
    status, resp, lat = call_api("POST", "/api/whatsapp", payload_wa)
    validation_ok = (status == 200)
    print(f"   Status: {'✅ PROCESADO' if validation_ok else f'⚠️ WARN ({status})'} | Latencia: {lat:.3f}s")
    report["tests"].append({"name": "E2E WhatsApp Flow", "ok": validation_ok, "latency": lat})

    # Test 4: Detección de Fraude (Duplicados)
    print("\n[TEST 4] Verificando Protección contra Fraude (Duplicados)...")
    # Reintentamos el mismo mensajeid del Test 3
    status, resp, lat = call_api("POST", "/api/whatsapp", payload_wa)
    # Debería dar un 200 con warnings o un error específico por duplicado
    fraud_blocked = (status == 200 and "already exists" in str(resp).lower()) or (status == 409) or (status == 200 and "duplicate" in str(resp).lower())
    print(f"   Status: {'🛡️ BLOQUEADO' if fraud_blocked else f'❌ FALLO ({status})'} | Res: {resp}")
    report["tests"].append({"name": "Fraud Detection", "ok": fraud_blocked, "latency": lat})

    print("-" * 60)
    print("\n📊 RESUMEN DE CERTIFICACIÓN:")
    total_lat = sum(t["latency"] for t in report["tests"])
    avg_lat = total_lat / len(report["tests"])
    print(f"   Latencia Promedio: {avg_lat:.3f}s")
    print(f"   Estado de Cero Error: {'CERTIFICADO' if all(t['ok'] for t in report['tests']) else 'REQUIERE REVISIÓN'}")
    print("=" * 60)

if __name__ == "__main__":
    run_audit()
