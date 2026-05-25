import json
import urllib.request
from datetime import datetime

BASE = "http://localhost:8000"

def test_direct_flow():
    print("🧪 PROBANDO FLUJO DE NOTIFICACIÓN DIRECTA (NEQUI OFICIAL)...")
    
    # Simulamos un payload que vendría de Pipedream/SendGrid
    payload = {
        "from": "notificaciones@nequi.com.co",
        "text": "¡Te transfirieron! Juan Gabriel Perez te envió $75.500. Ref: 987654321. 16/04/2026 16:45",
        "subject": "Te transfirieron plata"
    }
    
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(f"{BASE}/api/bank-relay/notify", data=data, method="POST")
    req.add_header('Content-Type', 'application/json')
    
    try:
        with urllib.request.urlopen(req) as r:
            res = json.loads(r.read().decode())
            print(f"✅ Respuesta del Servidor: {res}")
            print("\n💡 Verifica ahora:")
            print("1. El grupo de WhatsApp configurado (debe llegar el mensaje cohete 🚀).")
            print("2. El Dashboard de PayLens (la transacción debe aparecer VALIDADA_DIRECTO).")
            print("3. La tabla system_audit_logs en Supabase.")
    except Exception as e:
        print(f"❌ Error en la prueba: {e}")

if __name__ == "__main__":
    test_direct_flow()
